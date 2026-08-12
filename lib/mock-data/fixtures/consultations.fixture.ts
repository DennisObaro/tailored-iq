import type { Consultation, Review } from "@/lib/types";
import { DEMO_CLIENT_ID, DEMO_DUAL_ID, DEMO_EXPERT_ID } from "./users.fixture";
import { historicalConsultations, historicalReviews } from "./expert-review-history.fixture";

const d = (day: number) => `2026-07-${String(day).padStart(2, "0")}T14:00:00.000Z`;

export const seedConsultations: Consultation[] = [
  {
    id: "consultation_1",
    projectId: "project_1",
    clientId: DEMO_CLIENT_ID,
    expertId: DEMO_EXPERT_ID,
    scheduledFor: d(5),
    status: "completed",
    recordingConsent: true,
    durationSeconds: 1860,
    transcript: [
      { speaker: "expert", text: "So tell me about where the trainee program stands today.", timestampSec: 0 },
      { speaker: "client", text: "They complete every required module, but there's no follow-through after that.", timestampSec: 14 },
      { speaker: "expert", text: "That's really common when the program is built around compliance. Have you tried having them set their own goals?", timestampSec: 32 },
      { speaker: "client", text: "Not really — it's mostly been top-down curriculum.", timestampSec: 51 },
      { speaker: "expert", text: "I'd start there. When people co-author their plan, follow-through jumps significantly, even without new incentives.", timestampSec: 70 },
      { speaker: "client", text: "What about manager involvement? Ours are pretty hands-off on this.", timestampSec: 95 },
      { speaker: "expert", text: "That's the other lever. A short monthly coaching check-in tied to their self-authored plan does more than any tracking dashboard.", timestampSec: 112 },
    ],
    extractedInsights: [
      "Shifting from top-down curriculum to trainee-authored plans is the highest-leverage change available without new budget.",
      "A short monthly manager coaching check-in tied to the plan drives more follow-through than completion tracking.",
    ],
    createdAt: d(4),
  },
  {
    id: "consultation_2",
    projectId: "project_2",
    clientId: DEMO_CLIENT_ID,
    expertId: DEMO_DUAL_ID,
    scheduledFor: "2026-08-14T13:00:00.000Z",
    status: "scheduled",
    recordingConsent: true,
    createdAt: "2026-07-10T10:00:00.000Z",
  },
  {
    id: "consultation_6",
    projectId: "project_6",
    clientId: DEMO_DUAL_ID,
    expertId: "user_expert_6",
    scheduledFor: d(6),
    status: "completed",
    recordingConsent: true,
    durationSeconds: 1500,
    transcript: [
      { speaker: "expert", text: "Let's start with what the board has actually flagged as missing.", timestampSec: 0 },
      { speaker: "client", text: "Mostly that we don't have any formal committees, just a single independent observer.", timestampSec: 16 },
      { speaker: "expert", text: "For Series C, I'd prioritize a minimal audit committee and documented decision rights before anything else.", timestampSec: 40 },
      { speaker: "client", text: "That feels achievable without a full governance overhaul.", timestampSec: 63 },
      { speaker: "expert", text: "Exactly — it's about hitting the diligence checklist credibly, not building enterprise governance prematurely.", timestampSec: 80 },
    ],
    extractedInsights: [
      "A minimal audit committee and documented decision rights are the highest-priority governance additions before diligence.",
      "Full enterprise governance is unnecessary at this stage — the goal is a credible, lightweight baseline.",
    ],
    createdAt: d(5),
  },
  {
    id: "consultation_9",
    projectId: "project_9",
    clientId: DEMO_DUAL_ID,
    expertId: DEMO_EXPERT_ID,
    scheduledFor: d(22),
    status: "completed",
    recordingConsent: true,
    durationSeconds: 1740,
    createdAt: d(21),
  },
  ...historicalConsultations,
];

export const seedReviews: Review[] = [
  {
    id: "review_1",
    consultationId: "consultation_1",
    fromUserId: DEMO_CLIENT_ID,
    toUserId: DEMO_EXPERT_ID,
    usefulness: 5,
    understanding: 5,
    rating: 5,
    comment: "Marcus immediately understood the real issue and gave us something we could act on the same week.",
    createdAt: d(5),
  },
  {
    id: "review_9",
    consultationId: "consultation_9",
    fromUserId: DEMO_DUAL_ID,
    toUserId: DEMO_EXPERT_ID,
    usefulness: 5,
    understanding: 4,
    rating: 5,
    comment: "Practical, no-nonsense advice on making the jump from managing individual contributors to managing managers.",
    createdAt: d(22),
  },
  {
    id: "review_6",
    consultationId: "consultation_6",
    fromUserId: DEMO_DUAL_ID,
    toUserId: "user_expert_6",
    usefulness: 5,
    understanding: 4,
    rating: 5,
    comment: "Exactly the pragmatic, right-sized advice we needed ahead of diligence.",
    createdAt: d(6),
  },
  ...historicalReviews,
];
