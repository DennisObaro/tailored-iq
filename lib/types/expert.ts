/**
 * Expert-side domain types. The client-facing shape of an expert
 * (ExpertProfile) still lives in ./user.ts next to User/ClientProfile —
 * everything here is the machinery behind it: how someone is invited,
 * verified, what they contribute, and how that contribution is scored.
 */

/* ---------------------------------------------------------------- referral */

export type ExpertReferralStatus =
  | "unused"
  | "claimed"
  | "activated"
  | "expired"
  | "revoked";

/**
 * The first gate of the expert flow. A code must exist, be unexpired and
 * unused before anyone can reach expert signup, and it stays attached to
 * the resulting expert account (referredUserId) so the referring
 * expert/user can be credited once the referral activates.
 */
export interface ExpertReferral {
  id: string;
  code: string;
  /** Absent for platform-issued codes (invited directly by TailoredIQ). */
  referrerUserId?: string;
  referrerName: string;
  referredUserId?: string;
  referredEmail?: string;
  status: ExpertReferralStatus;
  createdAt: string;
  expiresAt?: string;
  claimedAt?: string;
  /** Set when the referred expert is approved — the point a referral "counts". */
  activatedAt?: string;
  /**
   * An evergreen code (demo/standing invitation) rather than a single-use
   * one. Claiming it never consumes it — it mints a normal single-use
   * referral bound to the claiming user, so everything downstream
   * (activation, crediting, the profile's referralCode) is unchanged.
   */
  reusable?: boolean;
}

/* ---------------------------------------------------------------- evidence */

export type ExpertEvidenceKind =
  | "cv"
  | "linkedin"
  | "website"
  | "link"
  | "thought_leadership";

export interface ExpertEvidence {
  id: string;
  kind: ExpertEvidenceKind;
  label: string;
  /** URL for links, file name for an uploaded CV. */
  value: string;
  /** Text pulled out of the evidence, used to support expertise claims. */
  excerpt?: string;
  addedAt: string;
}

/* --------------------------------------------------------------- expertise */

export type ExpertiseSource = "ai" | "manual";

/**
 * "supported" — backed by the CV/profile the analysis ran over.
 * "needs_evidence" — manually added and not supported by anything on file.
 * "evidence_submitted" — the expert has pointed at supporting experience,
 *   which a reviewer confirms during approval.
 */
export type ExpertiseEvidenceStatus = "supported" | "needs_evidence" | "evidence_submitted";

export interface ExpertExpertise {
  label: string;
  /** 0-100. Kept for AI-suggested areas; manual additions start at 0. */
  confidence: number;
  source: ExpertiseSource;
  evidenceStatus: ExpertiseEvidenceStatus;
  supportingEvidence?: string;
}

/* ------------------------------------------------------ policies and quiz */

export interface ExpertPolicyAcceptance {
  id: string;
  expertId: string;
  policyVersion: string;
  policyIds: string[];
  acceptedAt: string;
}

export interface ExpertQuizAnswer {
  questionId: string;
  choiceIndex: number;
  correct: boolean;
}

export interface ExpertQuizAttempt {
  id: string;
  expertId: string;
  answers: ExpertQuizAnswer[];
  score: number;
  total: number;
  passed: boolean;
  createdAt: string;
}

/* ------------------------------------------------------------ contribution */

export type ExpertContributionType =
  | "insight"
  | "review"
  | "playbook_input"
  | "case_study"
  | "topic_suggestion"
  | "thought_leadership"
  | "expert_conversation";

/**
 * Peer-reviewed lifecycle (spec §21). Nothing an expert writes becomes
 * public knowledge without passing through review first — the one
 * exception is playbook input on a project the expert is engaged on,
 * which goes straight to the client who asked for it.
 */
export type ExpertContributionStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "published"
  | "rejected";

export interface ExpertContribution {
  id: string;
  expertId: string;
  /** Set for project-scoped work (playbook input, brief review), absent for knowledge-base contributions. */
  projectId?: string;
  playbookId?: string;
  /** Set when written in response to a CallForInsight. */
  callForInsightId?: string;
  type: ExpertContributionType;
  title: string;
  content: string;
  status: ExpertContributionStatus;
  peerReviewIds: string[];
  /** True once a project-scoped contribution has been folded into the client's playbook. */
  incorporated: boolean;
  acceptedAt?: string;
  pointsAwarded: number;
  createdAt: string;
  updatedAt: string;
}

export type PeerReviewVerdict = "approve" | "request_changes";

export interface ExpertPeerReview {
  id: string;
  contributionId: string;
  reviewerId: string;
  verdict: PeerReviewVerdict;
  comment: string;
  createdAt: string;
}

/** An open prompt experts can respond to with an insight. */
export interface CallForInsight {
  id: string;
  title: string;
  prompt: string;
  category: string;
  closesAt: string;
  createdAt: string;
}

/* -------------------------------------------------------- points / standing */

export type ExpertPointsSource =
  | "peer_review"
  | "insight_published"
  | "case_study_published"
  | "expert_conversation"
  | "playbook_contribution"
  | "referral_activated"
  | "client_consultation"
  | "brief_review";

export interface ExpertPointsTransaction {
  id: string;
  expertId: string;
  source: ExpertPointsSource;
  points: number;
  note: string;
  contributionId?: string;
  createdAt: string;
}

/* -------------------------------------------------------------- onboarding */

export type ExpertOnboardingStep =
  | "background"
  | "evidence"
  | "expertise"
  | "help_areas"
  | "contributions"
  | "verification"
  | "policies"
  | "quiz"
  | "availability"
  | "preview";

/** How an expert is willing to contribute (spec §8). */
export type ExpertContributionPreference =
  | "review_validate"
  | "advise_leaders"
  | "playbook_contribution"
  | "share_insights"
  | "case_studies"
  | "expert_conversations"
  | "thought_leadership";
