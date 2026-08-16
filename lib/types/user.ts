import type {
  ExpertExpertise,
  ExpertEvidence,
  ExpertContributionPreference,
  ExpertOnboardingStep,
} from "./expert";

export type Role = "client" | "expert";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  roles: Role[];
  activeRole: Role;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientProfile {
  userId: string;
  industry: string;
  occupation: string;
  function: string;
  seniority: string;
  interests: string[];
}

export type ExpertVerificationStatus =
  | "pending"
  | "incomplete"
  | "approved"
  | "restricted"
  | "suspended"
  | "rejected";

export type ExpertLevel = "associate" | "senior" | "principal" | "distinguished";

/** Raw output of the expertise analysis, before the expert confirms/edits it. */
export interface SuggestedExpertise {
  label: string;
  confidence: number; // 0-100
}

/** Consultation preferences captured at the end of expert onboarding. */
export interface ExpertAvailabilityPreferences {
  timezone: string;
  hoursPerMonth: number;
  callLengthMinutes: number;
  noticeDays: number;
}

export interface ExpertProfile {
  userId: string;
  headline: string;
  bio: string;
  currentRole: string;
  /** Current/most recent employer. Distinct from industry (spec §3). */
  organisation: string;
  industries: string[];
  /** Business functions worked in (HR, Finance, Operations...) — not the same as industry. */
  functions: string[];
  /** Markets/countries the expert has actually operated in. */
  markets: string[];
  /** Matching categories (lib/constants/categories.ts) this expert is surfaced for. */
  expertiseTags: string[];
  /** Confirmed expertise areas with their provenance and evidence state. */
  expertise: ExpertExpertise[];
  /** Problem/outcome statements the expert can help leaders with (spec §7). */
  helpAreas: string[];
  /** Ways this expert wants to contribute (spec §8) — drives opportunity matching. */
  contributionPreferences: ExpertContributionPreference[];
  /** CV, LinkedIn and other professional evidence backing the profile. */
  evidence: ExpertEvidence[];
  yearsExperience: number;
  seniority: string;
  expertLevel: ExpertLevel;
  verificationStatus: ExpertVerificationStatus;
  policiesAccepted: boolean;
  /** Version of the expert policies accepted, so a policy update can re-prompt. */
  policyVersionAccepted?: string;
  ethicsQuizComplete: boolean;
  /** The referral code this expert account was created against (spec: RULE 1). */
  referralCode?: string;
  /** Onboarding steps finished so far — drives the progress checklist. */
  completedSteps: ExpertOnboardingStep[];
  submittedAt?: string;
  approvedAt?: string;
  /** Populated when verificationStatus is "rejected" or "restricted". */
  statusReason?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  rating: number;
  reviewCount: number;
  totalProjects: number;
  /** Running contribution points total; the ledger lives in expertPointsTransactions. */
  points: number;
  consultationRate: number;
  availabilitySlots: string[]; // ISO strings
  availabilityPreferences?: ExpertAvailabilityPreferences;
  isOnline: boolean;
  willingness: ExpertWillingness[];
}

/** What an expert will do on a given engagement — also the shape of an opportunity response. */
export type ExpertWillingness =
  | "review"
  | "contribute_insight"
  | "advisory_call"
  | "playbook_contribution"
  | "consulting_engagement";
