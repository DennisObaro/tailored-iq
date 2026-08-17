import type {
  ExpertAvailabilityPreferences,
  ExpertEvidence,
  ExpertExpertise,
  ExpertOnboardingStep,
  ExpertProfile,
  ExpertQuizAnswer,
  ExpertQuizAttempt,
  ExpertVerificationStatus,
  SuggestedExpertise,
  User,
} from "@/lib/types";
import { simulateNetwork, simulateGeneration, ApiError } from "./client";
import { db, type Database } from "./_db";
import { id } from "@/lib/utils/id";
import { suggestExpertise } from "@/lib/ai-sim/expertise-suggester";
import { parseCv, type ParsedCv } from "@/lib/ai-sim/cv-parser";
import {
  EXPERT_POLICY_VERSION,
  QUIZ_PASS_MARK,
  QUIZ_QUESTIONS,
  REQUIRED_STEPS,
  categoriesForHelpAreas,
} from "@/lib/constants/expert";
import { awardPointsWithin } from "./expert-points";

/* --------------------------------------------------------------- profile init */

function blankProfile(userId: string, referralCode?: string): ExpertProfile {
  return {
    userId,
    headline: "",
    bio: "",
    currentRole: "",
    organisation: "",
    industries: [],
    functions: [],
    markets: [],
    expertiseTags: [],
    expertise: [],
    helpAreas: [],
    contributionPreferences: [],
    evidence: [],
    yearsExperience: 0,
    seniority: "",
    expertLevel: "associate",
    verificationStatus: "incomplete",
    policiesAccepted: false,
    ethicsQuizComplete: false,
    referralCode,
    completedSteps: [],
    rating: 0,
    reviewCount: 0,
    totalProjects: 0,
    points: 0,
    consultationRate: 0,
    availabilitySlots: [],
    isOnline: false,
    willingness: [],
  };
}

function requireProfile(d: Database, userId: string): ExpertProfile {
  const profile = d.expertProfiles.find((p) => p.userId === userId);
  if (!profile) throw new ApiError("You haven't started an expert profile yet.", "NOT_FOUND");
  return profile;
}

function markStep(profile: ExpertProfile, step: ExpertOnboardingStep) {
  if (!profile.completedSteps.includes(step)) profile.completedSteps.push(step);
}

/**
 * Creates the expert profile shell once a referral code has been claimed.
 * This is the only way a profile comes into existence, which is what makes
 * the referral gate real rather than cosmetic — no code, no profile, and
 * every other onboarding call requires the profile to exist.
 */
export async function startExpertOnboarding(userId: string, referralCode: string): Promise<ExpertProfile> {
  return simulateNetwork(() =>
    db.update((d) => {
      const wanted = referralCode.trim().toUpperCase();
      /** Prefer the record bound to this user — an evergreen code is shared. */
      const referral =
        d.expertReferrals.find((r) => r.code === wanted && r.referredUserId === userId) ??
        d.expertReferrals.find((r) => r.code === wanted);
      if (!referral || referral.referredUserId !== userId) {
        throw new ApiError(
          "We couldn't match a verified referral code to your account. Start again from the referral step.",
          "REFERRAL_REQUIRED",
        );
      }

      const existing = d.expertProfiles.find((p) => p.userId === userId);
      if (existing) {
        existing.referralCode = referral.code;
        return existing;
      }

      const profile = blankProfile(userId, referral.code);
      d.expertProfiles.push(profile);

      const user = d.users.find((u) => u.id === userId);
      if (user) {
        if (!user.roles.includes("expert")) user.roles.push("expert");
        /**
         * For an expert-only signup the expert flow *is* their onboarding —
         * the client profile step doesn't apply, and leaving this false
         * would bounce them into it from the app shell.
         */
        user.onboardingComplete = true;
        user.activeRole = "expert";
        user.updatedAt = new Date().toISOString();
      }
      return profile;
    }),
  );
}

export async function getExpertProfile(userId: string): Promise<ExpertProfile | null> {
  return simulateNetwork(() => db.get().expertProfiles.find((p) => p.userId === userId) ?? null, {
    latency: [80, 200],
  });
}

/* ------------------------------------------------------------------- step: 3 */

export interface BackgroundInput {
  headline: string;
  currentRole: string;
  organisation: string;
  bio: string;
  industries: string[];
  functions: string[];
  markets: string[];
  yearsExperience: number;
  seniority: string;
}

export async function saveBackground(userId: string, input: BackgroundInput): Promise<ExpertProfile> {
  return simulateNetwork(() =>
    db.update((d) => {
      const profile = requireProfile(d, userId);
      Object.assign(profile, input);
      markStep(profile, "background");
      return profile;
    }),
  );
}

/* ------------------------------------------------------------------- step: 4 */

export interface EvidenceInput {
  kind: ExpertEvidence["kind"];
  label: string;
  value: string;
  /** For a CV: the document text we were able to read. */
  content?: string;
}

export interface AddEvidenceResult {
  profile: ExpertProfile;
  /** Present for CV uploads — what we managed to extract, for the "we filled this in for you" step. */
  parsed?: ParsedCv;
}

/**
 * Adds one piece of professional evidence. For a CV we run extraction and
 * pre-fill the background fields the expert hasn't already answered, so
 * nobody retypes a career we can already read (spec §4).
 *
 * A CV with no readable content is a real failure case — it throws rather
 * than silently storing an empty attachment.
 */
export async function addEvidence(userId: string, input: EvidenceInput): Promise<AddEvidenceResult> {
  const isCv = input.kind === "cv";
  const run = () =>
    db.update((d) => {
      const profile = requireProfile(d, userId);

      let parsed: ParsedCv | undefined;
      if (isCv) {
        const text = (input.content ?? "").trim();
        if (text.length < 40) {
          throw new ApiError(
            "We couldn't read enough from that file to verify anything.",
            "CV_UNREADABLE",
          );
        }
        parsed = parseCv(text);

        if (!profile.currentRole && parsed.currentRole) profile.currentRole = parsed.currentRole;
        if (!profile.organisation && parsed.organisation) profile.organisation = parsed.organisation;
        if (!profile.seniority && parsed.seniority) profile.seniority = parsed.seniority;
        if (!profile.yearsExperience && parsed.yearsExperience) profile.yearsExperience = parsed.yearsExperience;
        profile.industries = Array.from(new Set([...profile.industries, ...parsed.industries]));
        profile.functions = Array.from(new Set([...profile.functions, ...parsed.functions]));
        profile.markets = Array.from(new Set([...profile.markets, ...parsed.markets]));
      }

      if (input.kind === "linkedin") profile.linkedinUrl = input.value;
      if (input.kind === "website") profile.websiteUrl = input.value;

      const evidence: ExpertEvidence = {
        id: id("evidence"),
        kind: input.kind,
        label: input.label,
        value: input.value,
        excerpt: parsed?.excerpt ?? input.content?.trim().slice(0, 400),
        addedAt: new Date().toISOString(),
      };
      profile.evidence.push(evidence);
      markStep(profile, "evidence");

      return { profile, parsed };
    });

  return isCv ? simulateGeneration(run, { latency: [1200, 2200] }) : simulateNetwork(run);
}

export async function removeEvidence(userId: string, evidenceId: string): Promise<ExpertProfile> {
  return simulateNetwork(() =>
    db.update((d) => {
      const profile = requireProfile(d, userId);
      profile.evidence = profile.evidence.filter((e) => e.id !== evidenceId);
      if (profile.evidence.length === 0) {
        profile.completedSteps = profile.completedSteps.filter((s) => s !== "evidence");
      }
      return profile;
    }),
  );
}

/* ------------------------------------------------------------------- step: 5 */

/**
 * Reads everything on file — bio, role, and the text of every piece of
 * evidence — and proposes expertise areas with a confidence score. Areas
 * derived here are marked "supported" because they came out of evidence;
 * anything the expert adds by hand starts as "needs_evidence".
 */
export async function analyzeExpertise(userId: string): Promise<ExpertExpertise[]> {
  return simulateGeneration(() =>
    db.update((d) => {
      const profile = requireProfile(d, userId);
      const evidenceText = profile.evidence.map((e) => e.excerpt ?? e.label).join(" ");
      const corpus = [profile.bio, profile.currentRole, profile.organisation, evidenceText].join(" ");

      const suggestions: SuggestedExpertise[] = suggestExpertise(
        corpus,
        profile.currentRole,
        profile.yearsExperience,
      );

      const manual = profile.expertise.filter((e) => e.source === "manual");
      const analyzed: ExpertExpertise[] = suggestions
        .filter((s) => !manual.some((m) => m.label === s.label))
        .map((s) => ({ ...s, source: "ai" as const, evidenceStatus: "supported" as const }));

      profile.expertise = [...analyzed, ...manual];
      return profile.expertise;
    }),
  );
}

/** Does anything on file actually mention this area? Drives the evidence check (spec §6). */
export async function checkExpertiseSupport(
  userId: string,
  label: string,
): Promise<{ supported: boolean; matchedEvidence: string[] }> {
  return simulateNetwork(
    () => {
      const profile = db.get().expertProfiles.find((p) => p.userId === userId);
      if (!profile) return { supported: false, matchedEvidence: [] };

      const needle = label.toLowerCase();
      const sources = [
        ...profile.evidence.map((e) => e.excerpt ?? ""),
        profile.bio,
        profile.currentRole,
      ].filter(Boolean);

      const matchedEvidence = sources.filter((s) => s.toLowerCase().includes(needle));
      return { supported: matchedEvidence.length > 0, matchedEvidence };
    },
    { latency: [300, 600] },
  );
}

export async function confirmExpertise(userId: string, expertise: ExpertExpertise[]): Promise<ExpertProfile> {
  return simulateNetwork(() =>
    db.update((d) => {
      const profile = requireProfile(d, userId);
      if (expertise.length === 0) {
        throw new ApiError("Confirm at least one area of expertise.", "VALIDATION");
      }
      const unsupported = expertise.filter((e) => e.evidenceStatus === "needs_evidence");
      if (unsupported.length > 0) {
        throw new ApiError(
          `Add supporting experience for ${unsupported.map((e) => e.label).join(", ")} before continuing.`,
          "EVIDENCE_REQUIRED",
        );
      }

      profile.expertise = expertise;
      profile.expertiseTags = Array.from(new Set(expertise.map((e) => e.label)));
      markStep(profile, "expertise");
      return profile;
    }),
  );
}

/* ------------------------------------------------------------------- step: 7 */

export async function saveHelpAreas(userId: string, helpAreas: string[]): Promise<ExpertProfile> {
  return simulateNetwork(() =>
    db.update((d) => {
      const profile = requireProfile(d, userId);
      if (helpAreas.length === 0) {
        throw new ApiError("Pick at least one thing you can help leaders with.", "VALIDATION");
      }
      profile.helpAreas = helpAreas;

      /**
       * Help areas are the strongest matching signal we have — they're what
       * a client's challenge actually looks like — so they extend the
       * categories this expert gets surfaced for.
       */
      profile.expertiseTags = Array.from(
        new Set([...profile.expertiseTags, ...categoriesForHelpAreas(helpAreas)]),
      );
      markStep(profile, "help_areas");
      return profile;
    }),
  );
}

/* ------------------------------------------------------------------- step: 8 */

export async function saveContributionPreferences(
  userId: string,
  preferences: ExpertProfile["contributionPreferences"],
  willingness: ExpertProfile["willingness"],
): Promise<ExpertProfile> {
  return simulateNetwork(() =>
    db.update((d) => {
      const profile = requireProfile(d, userId);
      if (preferences.length === 0) {
        throw new ApiError("Pick at least one way you'd like to contribute.", "VALIDATION");
      }
      profile.contributionPreferences = preferences;
      profile.willingness = willingness;
      markStep(profile, "contributions");
      return profile;
    }),
  );
}

export async function acknowledgeVerification(userId: string): Promise<ExpertProfile> {
  return simulateNetwork(() =>
    db.update((d) => {
      const profile = requireProfile(d, userId);
      if (profile.evidence.length === 0) {
        throw new ApiError("Add at least one piece of professional evidence first.", "VALIDATION");
      }
      markStep(profile, "verification");
      return profile;
    }),
  );
}

/* ------------------------------------------------------------ steps: 10 & 11 */

export async function acceptPolicies(userId: string, policyIds: string[]): Promise<ExpertProfile> {
  return simulateNetwork(() =>
    db.update((d) => {
      const profile = requireProfile(d, userId);
      const now = new Date().toISOString();

      d.expertPolicyAcceptances.push({
        id: id("policy_acceptance"),
        expertId: userId,
        policyVersion: EXPERT_POLICY_VERSION,
        policyIds,
        acceptedAt: now,
      });

      profile.policiesAccepted = true;
      profile.policyVersionAccepted = EXPERT_POLICY_VERSION;
      markStep(profile, "policies");
      return profile;
    }),
  );
}

export interface QuizResult {
  attempt: ExpertQuizAttempt;
  passed: boolean;
  /** Which questions were wrong, so the retry can show what to revisit. */
  incorrectQuestionIds: string[];
}

/**
 * Marks the knowledge check. The quiz is not optional (spec §11) — failing
 * it leaves the profile unable to complete onboarding, and every attempt is
 * kept so a reviewer can see how many it took.
 */
export async function submitQuiz(userId: string, choices: Record<string, number>): Promise<QuizResult> {
  return simulateNetwork(() =>
    db.update((d) => {
      const profile = requireProfile(d, userId);

      const answers: ExpertQuizAnswer[] = QUIZ_QUESTIONS.map((q) => ({
        questionId: q.id,
        choiceIndex: choices[q.id] ?? -1,
        correct: choices[q.id] === q.correctIndex,
      }));
      const score = answers.filter((a) => a.correct).length;
      const passed = score >= QUIZ_PASS_MARK;

      const attempt: ExpertQuizAttempt = {
        id: id("quiz_attempt"),
        expertId: userId,
        answers,
        score,
        total: QUIZ_QUESTIONS.length,
        passed,
        createdAt: new Date().toISOString(),
      };
      d.expertQuizAttempts.push(attempt);

      profile.ethicsQuizComplete = passed;
      if (passed) markStep(profile, "quiz");
      else profile.completedSteps = profile.completedSteps.filter((s) => s !== "quiz");

      return {
        attempt,
        passed,
        incorrectQuestionIds: answers.filter((a) => !a.correct).map((a) => a.questionId),
      };
    }),
  );
}

export async function listQuizAttempts(userId: string): Promise<ExpertQuizAttempt[]> {
  return simulateNetwork(
    () =>
      db
        .get()
        .expertQuizAttempts.filter((a) => a.expertId === userId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    { latency: [80, 180] },
  );
}

/* ------------------------------------------------------------------ step: 13 */

export async function saveAvailability(
  userId: string,
  input: {
    preferences: ExpertAvailabilityPreferences;
    consultationRate: number;
    availabilitySlots: string[];
  },
): Promise<ExpertProfile> {
  return simulateNetwork(() =>
    db.update((d) => {
      const profile = requireProfile(d, userId);
      profile.availabilityPreferences = input.preferences;
      profile.consultationRate = input.consultationRate;
      profile.availabilitySlots = input.availabilitySlots;
      markStep(profile, "availability");
      return profile;
    }),
  );
}

/* ------------------------------------------------------------ steps: 15 & 16 */

export async function submitForReview(userId: string): Promise<ExpertProfile> {
  return simulateNetwork(() =>
    db.update((d) => {
      const profile = requireProfile(d, userId);

      const missing = REQUIRED_STEPS.filter((s) => !profile.completedSteps.includes(s));
      if (missing.length > 0) {
        throw new ApiError("Finish the remaining onboarding steps before submitting.", "INCOMPLETE");
      }
      if (!profile.ethicsQuizComplete) {
        throw new ApiError("You need to pass the knowledge check before submitting.", "QUIZ_REQUIRED");
      }

      const now = new Date().toISOString();
      profile.verificationStatus = "pending";
      profile.submittedAt = now;
      markStep(profile, "preview");

      d.notifications.unshift({
        id: id("notif"),
        userId,
        type: "expert_status_changed",
        title: "Expert profile submitted",
        body: "We're reviewing your professional background and expertise.",
        linkHref: "/expert/pending",
        read: false,
        createdAt: now,
      });

      return profile;
    }),
  );
}

/* ---------------------------------------------------- admin: review decisions */

export interface PendingExpertListing {
  user: User;
  profile: ExpertProfile;
  referrerName?: string;
}

/** Backs the reviewer queue. Only ever returns experts awaiting a decision. */
export async function listExpertsAwaitingReview(): Promise<PendingExpertListing[]> {
  return simulateNetwork(
    () => {
      const database = db.get();
      return database.expertProfiles
        .filter((p) => p.verificationStatus === "pending")
        .sort((a, b) => ((a.submittedAt ?? "") < (b.submittedAt ?? "") ? -1 : 1))
        .map((profile): PendingExpertListing | null => {
          const user = database.users.find((u) => u.id === profile.userId);
          if (!user) return null;
          const referral = database.expertReferrals.find((r) => r.referredUserId === profile.userId);
          return { user, profile, referrerName: referral?.referrerName };
        })
        .filter((x): x is PendingExpertListing => x !== null);
    },
    { latency: [200, 400] },
  );
}

/**
 * The approval decision. Approving also activates the referral that brought
 * this expert in and credits the referrer — a referral only "counts" once
 * the person it introduced is actually vetted.
 */
export async function decideExpertReview(
  userId: string,
  decision: Extract<ExpertVerificationStatus, "approved" | "rejected" | "restricted">,
  reason?: string,
): Promise<ExpertProfile> {
  return simulateNetwork(() =>
    db.update((d) => {
      const profile = requireProfile(d, userId);
      const now = new Date().toISOString();

      profile.verificationStatus = decision;
      profile.statusReason = decision === "approved" ? undefined : reason;
      if (decision === "approved") profile.approvedAt = now;

      if (decision === "approved") {
        const referral = d.expertReferrals.find((r) => r.referredUserId === userId);
        if (referral && referral.status !== "activated") {
          referral.status = "activated";
          referral.activatedAt = now;
          if (referral.referrerUserId) {
            const referredUser = d.users.find((u) => u.id === userId);
            awardPointsWithin(d, {
              expertId: referral.referrerUserId,
              source: "referral_activated",
              note: `Referred expert approved: ${referredUser ? `${referredUser.firstName} ${referredUser.lastName}` : "an expert"}`,
            });
          }
        }
      }

      d.notifications.unshift({
        id: id("notif"),
        userId,
        type: "expert_status_changed",
        title:
          decision === "approved"
            ? "You're an approved TailoredIQ expert"
            : decision === "restricted"
              ? "Your expert access is restricted"
              : "Your expert application wasn't approved",
        body:
          decision === "approved"
            ? "Your experience can now be matched to client challenges."
            : (reason ?? "Check your expert profile for details."),
        linkHref: decision === "approved" ? "/expert/dashboard" : "/expert/profile",
        read: false,
        createdAt: now,
      });

      return profile;
    }),
  );
}

/* ------------------------------------------------------------------ editing */

/** Post-approval profile edits. Deliberately cannot touch verification state. */
export async function updateExpertProfile(
  userId: string,
  patch: Partial<
    Pick<
      ExpertProfile,
      | "headline"
      | "bio"
      | "currentRole"
      | "organisation"
      | "industries"
      | "functions"
      | "markets"
      | "helpAreas"
      | "contributionPreferences"
      | "willingness"
      | "consultationRate"
      | "availabilitySlots"
      | "availabilityPreferences"
      | "isOnline"
      | "linkedinUrl"
      | "websiteUrl"
    >
  >,
): Promise<ExpertProfile> {
  return simulateNetwork(() =>
    db.update((d) => {
      const profile = requireProfile(d, userId);
      Object.assign(profile, patch);
      if (patch.helpAreas) {
        profile.expertiseTags = Array.from(
          new Set([...profile.expertiseTags, ...categoriesForHelpAreas(patch.helpAreas)]),
        );
      }
      return profile;
    }),
  );
}
