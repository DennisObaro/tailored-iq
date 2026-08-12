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

export interface SuggestedExpertise {
  label: string;
  confidence: number; // 0-100
}

export interface ExpertProfile {
  userId: string;
  headline: string;
  bio: string;
  currentRole: string;
  industries: string[];
  expertiseTags: string[];
  suggestedExpertise: SuggestedExpertise[];
  yearsExperience: number;
  seniority: string;
  expertLevel: ExpertLevel;
  verificationStatus: ExpertVerificationStatus;
  policiesAccepted: boolean;
  ethicsQuizComplete: boolean;
  linkedinUrl?: string;
  rating: number;
  reviewCount: number;
  totalProjects: number;
  consultationRate: number;
  availabilitySlots: string[]; // ISO strings
  isOnline: boolean;
  willingness: ("review" | "contribute_insight" | "advisory_call" | "playbook_contribution" | "consulting_engagement")[];
}
