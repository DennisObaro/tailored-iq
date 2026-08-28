import type { Engagement } from "@/lib/types";
import { DEMO_CLIENT_ID, DEMO_EXPERT_ID } from "./users.fixture";

/**
 * Amara already worked with Marcus on this challenge (consultation_1) before
 * the playbook existed — booking him for implementation is the natural next
 * step, and it's what backs the demo expert account's Implementation tab.
 * Reuses conversation_seed_1 (consultations.fixture.ts) the same way
 * getOrCreateEngagementWithin does for a real booking.
 */
export const seedEngagements: Engagement[] = [
  {
    id: "engagement_1",
    clientId: DEMO_CLIENT_ID,
    expertId: DEMO_EXPERT_ID,
    playbookId: "playbook_1",
    projectId: "project_1",
    conversationId: "conversation_seed_1",
    status: "in_progress",
    createdAt: "2026-07-10T09:00:00.000Z",
    updatedAt: "2026-08-20T09:00:00.000Z",
  },
];
