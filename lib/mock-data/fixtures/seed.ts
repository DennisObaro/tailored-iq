import type { Database } from "@/lib/api/_db";
import { seedUsers, seedClientProfiles, seedExpertProfiles } from "./users.fixture";
import { seedProjects, seedBriefs, seedConversations } from "./projects.fixture";
import { seedReports } from "./reports.fixture";
import { seedPlaybooks, seedContributions } from "./playbooks.fixture";
import { seedConsultations, seedExpertConversations, seedReviews } from "./consultations.fixture";
import { seedOpportunities } from "./opportunities.fixture";
import { seedNotifications } from "./notifications.fixture";
import {
  seedCallsForInsight,
  seedExpertContributions,
  seedExpertPeerReviews,
  seedExpertPointsTransactions,
  seedExpertPolicyAcceptances,
  seedExpertQuizAttempts,
  seedExpertReferrals,
} from "./expert-network.fixture";
import { levelForPoints } from "@/lib/constants/expert";
import type { ExpertProfile, ExpertPointsTransaction } from "@/lib/types";

/**
 * Points and level are stored on the profile (that's what the UI reads),
 * but the transaction ledger is what they mean. Deriving both here keeps a
 * seeded profile from ever disagreeing with its own history — the same
 * invariant awardPoints() maintains at runtime.
 */
function reconcileStanding(profiles: ExpertProfile[], transactions: ExpertPointsTransaction[]) {
  for (const profile of profiles) {
    profile.points = transactions
      .filter((t) => t.expertId === profile.userId)
      .reduce((sum, t) => sum + t.points, 0);
    profile.expertLevel = levelForPoints(profile.points).key;
  }
  return profiles;
}

export function seedDatabase(): Database {
  return {
    users: structuredClone(seedUsers),
    clientProfiles: structuredClone(seedClientProfiles),
    expertProfiles: reconcileStanding(
      structuredClone(seedExpertProfiles),
      seedExpertPointsTransactions,
    ),
    projects: structuredClone(seedProjects),
    briefs: structuredClone(seedBriefs),
    conversations: structuredClone(seedConversations),
    reports: structuredClone(seedReports),
    consultations: structuredClone(seedConsultations),
    playbooks: structuredClone(seedPlaybooks),
    contributions: [...structuredClone(seedContributions), ...structuredClone(seedExpertContributions)],
    reviews: structuredClone(seedReviews),
    notifications: structuredClone(seedNotifications),
    opportunities: structuredClone(seedOpportunities),
    playbookUnlocks: [],
    /** Nothing pre-saved: a saved list the client didn't choose isn't a saved list. */
    savedExperts: [],
    expertReferrals: structuredClone(seedExpertReferrals),
    expertPolicyAcceptances: structuredClone(seedExpertPolicyAcceptances),
    expertQuizAttempts: structuredClone(seedExpertQuizAttempts),
    expertPointsTransactions: structuredClone(seedExpertPointsTransactions),
    expertPeerReviews: structuredClone(seedExpertPeerReviews),
    callsForInsight: structuredClone(seedCallsForInsight),
    /** Live-brief pings are created as clients submit; there's nothing meaningful to pre-seed. */
    expertBriefParticipations: [],
    /**
     * The four demo consultations get a matching thread so they're
     * reachable from the merged inbox; nothing else is pre-seeded since a
     * thread otherwise only exists once someone reaches out.
     */
    expertConversations: structuredClone(seedExpertConversations),
    conversationMessages: [],
  };
}
