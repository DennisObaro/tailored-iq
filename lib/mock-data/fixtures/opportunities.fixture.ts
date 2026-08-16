import type { Opportunity } from "@/lib/types";
import { DEMO_EXPERT_ID } from "./users.fixture";

const d = (day: number) => `2026-07-${String(day).padStart(2, "0")}T10:00:00.000Z`;

export const seedOpportunities: Opportunity[] = [
  {
    id: "opportunity_1",
    projectId: "project_7",
    expertId: DEMO_EXPERT_ID,
    title: "Aligning a newly merged leadership team",
    summary: "After a recent acquisition, the client's combined leadership team isn't operating as one team yet.",
    relevanceReason: "Your experience in leadership development and organisational design aligns closely with this challenge.",
    category: "Leadership",
    requestedContributions: ["advisory_call", "playbook_contribution"],
    response: null,
    offeredContributions: [],
    createdAt: d(19),
  },
  {
    id: "opportunity_2",
    projectId: "project_8",
    expertId: DEMO_EXPERT_ID,
    title: "Rebuilding engagement after a difficult restructuring",
    summary: "The client's team morale hasn't recovered since a restructuring last quarter.",
    relevanceReason: "Your experience in people & culture transformation is directly relevant here.",
    category: "People & Culture",
    requestedContributions: ["advisory_call", "contribute_insight"],
    response: null,
    offeredContributions: [],
    createdAt: d(20),
  },
  {
    id: "opportunity_3",
    projectId: "project_8",
    expertId: "user_expert_7",
    title: "Rebuilding engagement after a difficult restructuring",
    summary: "The client's team morale hasn't recovered since a restructuring last quarter.",
    relevanceReason: "Your culture transformation work with distributed workforces closely matches this situation.",
    category: "People & Culture",
    requestedContributions: ["advisory_call"],
    response: null,
    offeredContributions: [],
    createdAt: d(20),
  },
];
