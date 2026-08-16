import type {
  CallForInsight,
  ExpertContribution,
  ExpertPeerReview,
  ExpertPointsTransaction,
  ExpertPolicyAcceptance,
  ExpertQuizAttempt,
  ExpertReferral,
} from "@/lib/types";
import { DEMO_DUAL_ID, DEMO_EXPERT_ID, PENDING_EXPERT_ID } from "./users.fixture";
import { EXPERT_POLICY_VERSION, POINT_VALUES } from "@/lib/constants/expert";

const d = (day: number, hour = 10) => `2026-07-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00.000Z`;
const aug = (day: number, hour = 10) => `2026-08-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00.000Z`;

/**
 * Referral codes covering every state the gate has to handle, so the
 * invalid/expired/already-used paths are all reachable in the demo without
 * anyone having to construct them:
 *
 *   EMP-MARCUS24 — valid, issued by Marcus Webb (use this one)
 *   EMP-JORDAN77 — valid, issued by Jordan Blake
 *   EMP-FOUNDER1 — valid, platform-issued, no referring expert
 *   EMP-EXPIRED0 — expired
 *   EMP-USED0001 — already claimed by another expert
 *   EMP-REVOKED1 — revoked by the referrer
 */
export const seedExpertReferrals: ExpertReferral[] = [
  {
    id: "referral_1",
    code: "EMP-MARCUS24",
    referrerUserId: DEMO_EXPERT_ID,
    referrerName: "Marcus Webb",
    status: "unused",
    createdAt: d(1),
    expiresAt: "2026-12-31T23:59:59.000Z",
  },
  {
    id: "referral_2",
    code: "EMP-JORDAN77",
    referrerUserId: DEMO_DUAL_ID,
    referrerName: "Jordan Blake",
    status: "unused",
    createdAt: d(2),
    expiresAt: "2026-12-31T23:59:59.000Z",
  },
  {
    id: "referral_3",
    code: "EMP-FOUNDER1",
    referrerName: "TailoredIQ",
    status: "unused",
    createdAt: d(1),
  },
  {
    id: "referral_4",
    code: "EMP-EXPIRED0",
    referrerUserId: DEMO_EXPERT_ID,
    referrerName: "Marcus Webb",
    status: "unused",
    createdAt: "2026-01-05T10:00:00.000Z",
    expiresAt: "2026-04-05T10:00:00.000Z",
  },
  {
    id: "referral_5",
    code: "EMP-USED0001",
    referrerUserId: DEMO_EXPERT_ID,
    referrerName: "Marcus Webb",
    referredUserId: "user_expert_7",
    referredEmail: "ethan.kowalski@example.com",
    status: "activated",
    createdAt: "2026-03-02T10:00:00.000Z",
    claimedAt: "2026-03-04T10:00:00.000Z",
    activatedAt: "2026-03-11T10:00:00.000Z",
  },
  {
    id: "referral_6",
    code: "EMP-REVOKED1",
    referrerUserId: DEMO_DUAL_ID,
    referrerName: "Jordan Blake",
    status: "revoked",
    createdAt: d(3),
  },
  {
    id: "referral_7",
    code: "EMP-TOMIWA01",
    referrerUserId: DEMO_EXPERT_ID,
    referrerName: "Marcus Webb",
    referredUserId: PENDING_EXPERT_ID,
    referredEmail: "tomiwa.balogun@example.com",
    status: "claimed",
    createdAt: aug(8),
    claimedAt: aug(10),
  },
];

/** Open prompts experts can answer with an insight (spec §21). */
export const seedCallsForInsight: CallForInsight[] = [
  {
    id: "cfi_1",
    title: "What actually makes a first-time manager succeed?",
    prompt:
      "We keep seeing clients promote strong individual contributors into management with no support. What did you put in place that genuinely changed the outcome — and what looked good but didn't work?",
    category: "Leadership",
    closesAt: "2026-09-15T23:59:59.000Z",
    createdAt: aug(1),
  },
  {
    id: "cfi_2",
    title: "Rebuilding trust after a restructuring",
    prompt:
      "Leaders often ask how to recover engagement after cutting roles. What did you do in the first 90 days after a restructuring that made a measurable difference?",
    category: "People & Culture",
    closesAt: "2026-09-30T23:59:59.000Z",
    createdAt: aug(4),
  },
  {
    id: "cfi_3",
    title: "The first market you'd expand into — and why",
    prompt:
      "For a business with one strong home market, what's the reasoning you'd apply to sequence the next two markets? Real examples welcome.",
    category: "Market Expansion",
    closesAt: "2026-10-10T23:59:59.000Z",
    createdAt: aug(6),
  },
];

export const seedExpertContributions: ExpertContribution[] = [
  {
    id: "contribution_kb_1",
    expertId: DEMO_EXPERT_ID,
    callForInsightId: "cfi_1",
    type: "insight",
    title: "Give new managers one decision to own, not a course",
    content:
      "Every leadership programme I ran that started with training had the same problem: managers learned a vocabulary and went back to the same job. What changed things was giving each new manager one real decision to own end-to-end within their first 60 days — a hiring call, a budget line, a process they could redesign — with a named sponsor they debriefed with fortnightly. The training then had something to attach to. The programmes that worked were 20% content and 80% supported real decisions.",
    status: "published",
    peerReviewIds: ["peer_review_1"],
    incorporated: false,
    acceptedAt: aug(6),
    pointsAwarded: POINT_VALUES.insight_published,
    createdAt: aug(3),
    updatedAt: aug(6),
  },
  {
    id: "contribution_kb_2",
    expertId: "user_expert_7",
    callForInsightId: "cfi_2",
    type: "case_study",
    title: "90 days after cutting 18% of a site workforce",
    content:
      "We cut 18% of a manufacturing site and engagement fell further in month two than in the week of the announcement — because leadership went quiet. What recovered it: weekly 15-minute shift-start briefings held by line managers (not HR), a published list of what would not change, and one visible reversal where we admitted a decision was wrong and undid it. Scores recovered to pre-restructuring levels in five months. The reversal mattered more than any communication plan.",
    status: "under_review",
    peerReviewIds: [],
    incorporated: false,
    pointsAwarded: 0,
    createdAt: aug(11),
    updatedAt: aug(11),
  },
  {
    id: "contribution_kb_3",
    expertId: "user_expert_2",
    type: "thought_leadership",
    title: "Cost-to-serve is an operating model problem, not a procurement one",
    content:
      "Most cost-to-serve programmes I've seen start in procurement because that's where the numbers are legible. In every network I ran, the real cost sat in how the operating model routed work — the same order touching four sites because nobody owned the routing rule. Fix ownership before renegotiating a single contract.",
    status: "published",
    peerReviewIds: ["peer_review_2"],
    incorporated: false,
    acceptedAt: aug(9),
    pointsAwarded: POINT_VALUES.insight_published,
    createdAt: aug(7),
    updatedAt: aug(9),
  },
  {
    id: "contribution_kb_4",
    expertId: DEMO_DUAL_ID,
    type: "topic_suggestion",
    title: "How should a leader decide whether to fix or exit a partnership?",
    content:
      "Clients ask this constantly and there's nothing in the knowledge base on it. Worth a call for insight — the honest answer usually involves sunk-cost reasoning nobody wants to name out loud.",
    status: "submitted",
    peerReviewIds: [],
    incorporated: false,
    pointsAwarded: 0,
    createdAt: aug(12),
    updatedAt: aug(12),
  },
];

export const seedExpertPeerReviews: ExpertPeerReview[] = [
  {
    id: "peer_review_1",
    contributionId: "contribution_kb_1",
    reviewerId: "user_expert_7",
    verdict: "approve",
    comment:
      "Matches what I've seen on frontline sites — the sponsor debrief is the part most programmes skip. Worth publishing as-is.",
    createdAt: aug(5),
  },
  {
    id: "peer_review_2",
    contributionId: "contribution_kb_3",
    reviewerId: DEMO_EXPERT_ID,
    verdict: "approve",
    comment: "Strong and specific. The routing-ownership point is the one clients consistently miss.",
    createdAt: aug(8),
  },
];

export const seedExpertPolicyAcceptances: ExpertPolicyAcceptance[] = [
  {
    id: "policy_acceptance_1",
    expertId: DEMO_EXPERT_ID,
    policyVersion: EXPERT_POLICY_VERSION,
    policyIds: [
      "confidentiality",
      "client_privacy",
      "conflicts",
      "conduct",
      "accuracy",
      "competence",
      "client_information_use",
      "knowledge_base",
    ],
    acceptedAt: "2026-06-20T09:00:00.000Z",
  },
  {
    id: "policy_acceptance_2",
    expertId: PENDING_EXPERT_ID,
    policyVersion: EXPERT_POLICY_VERSION,
    policyIds: [
      "confidentiality",
      "client_privacy",
      "conflicts",
      "conduct",
      "accuracy",
      "competence",
      "client_information_use",
      "knowledge_base",
    ],
    acceptedAt: aug(12, 11),
  },
];

export const seedExpertQuizAttempts: ExpertQuizAttempt[] = [
  {
    id: "quiz_attempt_1",
    expertId: DEMO_EXPERT_ID,
    answers: [],
    score: 6,
    total: 6,
    passed: true,
    createdAt: "2026-06-20T09:15:00.000Z",
  },
  {
    id: "quiz_attempt_2",
    expertId: PENDING_EXPERT_ID,
    answers: [],
    score: 4,
    total: 6,
    passed: false,
    createdAt: aug(12, 11),
  },
  {
    id: "quiz_attempt_3",
    expertId: PENDING_EXPERT_ID,
    answers: [],
    score: 6,
    total: 6,
    passed: true,
    createdAt: aug(12, 12),
  },
];

/** Ledger behind ExpertProfile.points — every total is the sum of real events. */
function ledger(
  expertId: string,
  rows: { source: keyof typeof POINT_VALUES; note: string; day: number; times?: number }[],
): ExpertPointsTransaction[] {
  const out: ExpertPointsTransaction[] = [];
  rows.forEach((row, rowIndex) => {
    for (let i = 0; i < (row.times ?? 1); i++) {
      out.push({
        id: `points_${expertId}_${rowIndex}_${i}`,
        expertId,
        source: row.source,
        points: POINT_VALUES[row.source],
        note: row.note,
        createdAt: d(Math.min(28, row.day + i)),
      });
    }
  });
  return out;
}

export const seedExpertPointsTransactions: ExpertPointsTransaction[] = [
  ...ledger(DEMO_EXPERT_ID, [
    { source: "client_consultation", note: "Consultation completed", day: 4, times: 24 },
    { source: "playbook_contribution", note: "Contributed to a client playbook", day: 12, times: 6 },
    { source: "peer_review", note: "Reviewed a peer contribution", day: 16, times: 8 },
    { source: "insight_published", note: "Published: Give new managers one decision to own", day: 20, times: 1 },
    { source: "referral_activated", note: "Referred expert approved: Ethan Kowalski", day: 22, times: 1 },
  ]),
  ...ledger(DEMO_DUAL_ID, [
    { source: "client_consultation", note: "Consultation completed", day: 5, times: 10 },
    { source: "brief_review", note: "Reviewed client recommendations", day: 14, times: 3 },
    { source: "peer_review", note: "Reviewed a peer contribution", day: 18, times: 4 },
  ]),
  ...ledger("user_expert_2", [
    { source: "client_consultation", note: "Consultation completed", day: 3, times: 28 },
    { source: "playbook_contribution", note: "Contributed to a client playbook", day: 13, times: 5 },
    { source: "insight_published", note: "Published: Cost-to-serve is an operating model problem", day: 21, times: 1 },
    { source: "case_study_published", note: "Published: Standardizing a 40-site network", day: 23, times: 1 },
  ]),
  ...ledger("user_expert_3", [
    { source: "client_consultation", note: "Consultation completed", day: 6, times: 12 },
    { source: "brief_review", note: "Reviewed client recommendations", day: 15, times: 4 },
    { source: "peer_review", note: "Reviewed a peer contribution", day: 19, times: 2 },
  ]),
  ...ledger("user_expert_4", [
    { source: "client_consultation", note: "Consultation completed", day: 7, times: 11 },
    { source: "playbook_contribution", note: "Contributed to a client playbook", day: 14, times: 3 },
    { source: "expert_conversation", note: "Joined the AI-in-regulated-industries panel", day: 22, times: 1 },
  ]),
  ...ledger("user_expert_5", [
    { source: "client_consultation", note: "Consultation completed", day: 8, times: 8 },
    { source: "peer_review", note: "Reviewed a peer contribution", day: 17, times: 3 },
    { source: "brief_review", note: "Reviewed client recommendations", day: 20, times: 2 },
  ]),
  ...ledger("user_expert_6", [
    { source: "client_consultation", note: "Consultation completed", day: 2, times: 26 },
    { source: "brief_review", note: "Reviewed client recommendations", day: 12, times: 8 },
    { source: "peer_review", note: "Reviewed a peer contribution", day: 18, times: 6 },
    { source: "insight_published", note: "Published: Governance that scales with the company", day: 24, times: 2 },
  ]),
  ...ledger("user_expert_7", [
    { source: "client_consultation", note: "Consultation completed", day: 7, times: 12 },
    { source: "peer_review", note: "Reviewed a peer contribution", day: 19, times: 4 },
    { source: "case_study_published", note: "Published: 90 days after cutting 18% of a site workforce", day: 25, times: 1 },
  ]),
  ...ledger("user_expert_8", [
    { source: "client_consultation", note: "Consultation completed", day: 1, times: 30 },
    { source: "expert_conversation", note: "Joined the operational safety podcast", day: 20, times: 2 },
    { source: "case_study_published", note: "Published: Rebuilding safety culture after a Tier 1 incident", day: 24, times: 2 },
  ]),
];
