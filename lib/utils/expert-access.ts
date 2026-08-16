import type { ExpertProfile } from "@/lib/types";
import { REQUIRED_STEPS } from "@/lib/constants/expert";

export type ExpertAccessLevel = "no_profile" | "incomplete" | "pending" | "approved" | "blocked";

export interface ExpertAccess {
  level: ExpertAccessLevel;
  /** Can see that opportunities exist, in redacted form. */
  canBrowseOpportunities: boolean;
  /** Can say "interested" and take on client work. */
  canAcceptWork: boolean;
  /** Can open a client's brief, report or transcript. */
  canViewClientDetail: boolean;
  canJoinCalls: boolean;
  /** Can write insights/case studies for the knowledge base. */
  canContributeKnowledge: boolean;
  /** One line explaining the restriction, or null when unrestricted. */
  reason: string | null;
  /** Where to send them to fix it. */
  actionHref: string | null;
  actionLabel: string | null;
}

const FULL: ExpertAccess = {
  level: "approved",
  canBrowseOpportunities: true,
  canAcceptWork: true,
  canViewClientDetail: true,
  canJoinCalls: true,
  canContributeKnowledge: true,
  reason: null,
  actionHref: null,
  actionLabel: null,
};

/** Onboarding steps still outstanding — drives both the checklist and the gate. */
export function missingSteps(profile: ExpertProfile | null) {
  if (!profile) return REQUIRED_STEPS;
  return REQUIRED_STEPS.filter((step) => !profile.completedSteps.includes(step));
}

/**
 * Single source of truth for what an expert is allowed to do (spec §30).
 * Every expert route asks this rather than testing verificationStatus
 * inline, so a new status can't accidentally grant access somewhere.
 */
export function getExpertAccess(profile: ExpertProfile | null | undefined): ExpertAccess {
  if (!profile) {
    return {
      level: "no_profile",
      canBrowseOpportunities: false,
      canAcceptWork: false,
      canViewClientDetail: false,
      canJoinCalls: false,
      canContributeKnowledge: false,
      reason: "You haven't started your expert profile yet.",
      actionHref: "/become-an-expert",
      actionLabel: "Become an expert",
    };
  }

  switch (profile.verificationStatus) {
    case "approved":
      return FULL;

    case "pending":
      return {
        level: "pending",
        canBrowseOpportunities: true,
        canAcceptWork: false,
        canViewClientDetail: false,
        canJoinCalls: false,
        canContributeKnowledge: true,
        reason: "Your expert profile is under review. You'll get access to client work once it's approved.",
        actionHref: "/expert/pending",
        actionLabel: "View review status",
      };

    case "incomplete":
      return {
        level: "incomplete",
        canBrowseOpportunities: false,
        canAcceptWork: false,
        canViewClientDetail: false,
        canJoinCalls: false,
        canContributeKnowledge: false,
        reason: "Complete your expert onboarding to unlock client opportunities.",
        actionHref: "/expert/onboarding",
        actionLabel: "Continue onboarding",
      };

    case "restricted":
      return {
        level: "blocked",
        canBrowseOpportunities: true,
        canAcceptWork: false,
        canViewClientDetail: false,
        canJoinCalls: false,
        canContributeKnowledge: true,
        reason:
          profile.statusReason ??
          "Your expert access is restricted. You can still contribute to the knowledge base while this is resolved.",
        actionHref: "/expert/profile",
        actionLabel: "View your profile",
      };

    case "suspended":
    case "rejected":
    default:
      return {
        level: "blocked",
        canBrowseOpportunities: false,
        canAcceptWork: false,
        canViewClientDetail: false,
        canJoinCalls: false,
        canContributeKnowledge: false,
        reason:
          profile.statusReason ??
          (profile.verificationStatus === "rejected"
            ? "Your expert application wasn't approved."
            : "Your expert account is suspended."),
        actionHref: "/settings",
        actionLabel: "Contact support",
      };
  }
}
