import type { Database } from "@/lib/api/_db";
import { seedUsers, seedClientProfiles, seedExpertProfiles } from "./users.fixture";
import { seedProjects, seedBriefs, seedConversations } from "./projects.fixture";
import { seedReports } from "./reports.fixture";
import { seedPlaybooks, seedContributions } from "./playbooks.fixture";
import { seedConsultations, seedReviews } from "./consultations.fixture";
import { seedOpportunities } from "./opportunities.fixture";
import { seedNotifications } from "./notifications.fixture";

export function seedDatabase(): Database {
  return {
    users: structuredClone(seedUsers),
    clientProfiles: structuredClone(seedClientProfiles),
    expertProfiles: structuredClone(seedExpertProfiles),
    projects: structuredClone(seedProjects),
    briefs: structuredClone(seedBriefs),
    conversations: structuredClone(seedConversations),
    reports: structuredClone(seedReports),
    consultations: structuredClone(seedConsultations),
    playbooks: structuredClone(seedPlaybooks),
    contributions: structuredClone(seedContributions),
    reviews: structuredClone(seedReviews),
    notifications: structuredClone(seedNotifications),
    opportunities: structuredClone(seedOpportunities),
  };
}
