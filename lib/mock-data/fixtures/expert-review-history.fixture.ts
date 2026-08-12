import type { Project, Consultation, Review } from "@/lib/types";
import { DEMO_DUAL_ID, PAST_CLIENT_1_ID, PAST_CLIENT_2_ID } from "./users.fixture";

const d = (day: number) => `2026-07-${String(day).padStart(2, "0")}T15:00:00.000Z`;

/**
 * Backfills a second (or first) real review for every expert who didn't
 * already have two from the main fixtures, so every expert profile has
 * genuine review content instead of an empty Reviews section. Each row
 * becomes one completed project + consultation + review, attributed to
 * one of the two dedicated past-client identities rather than a real
 * demo account, so no demo dashboard gets cluttered with these.
 */
const ROWS: {
  id: string;
  expertId: string;
  clientId: string;
  category: string;
  title: string;
  challenge: string;
  comment: string;
  rating: number;
  day: number;
}[] = [
  {
    id: "10",
    expertId: DEMO_DUAL_ID,
    clientId: PAST_CLIENT_1_ID,
    category: "Market Expansion",
    title: "Entering the DACH market",
    challenge: "We wanted to expand into Germany, Austria and Switzerland but had no regulatory playbook.",
    comment: "Jordan gave us a realistic entry sequence and flagged compliance risks we hadn't considered.",
    rating: 5,
    day: 23,
  },
  {
    id: "11",
    expertId: DEMO_DUAL_ID,
    clientId: PAST_CLIENT_2_ID,
    category: "Strategy",
    title: "Repositioning after a failed product launch",
    challenge: "Our flagship product launch missed targets and leadership needed a reset on strategy.",
    comment: "Sharp, structured thinking. Jordan cut through a lot of noise in one session.",
    rating: 5,
    day: 24,
  },
  {
    id: "12",
    expertId: "user_expert_2",
    clientId: PAST_CLIENT_1_ID,
    category: "Operations",
    title: "Cutting cost-to-serve across 12 warehouses",
    challenge: "Our logistics costs were growing faster than revenue and we didn't know where the waste was.",
    comment: "Priya spotted the process bottlenecks within the first 20 minutes.",
    rating: 5,
    day: 25,
  },
  {
    id: "13",
    expertId: "user_expert_2",
    clientId: PAST_CLIENT_2_ID,
    category: "Operations",
    title: "Standardizing operations before a new site launch",
    challenge: "We were opening a new site and had no repeatable operating playbook.",
    comment: "Extremely practical — gave us a checklist we actually used.",
    rating: 5,
    day: 26,
  },
  {
    id: "14",
    expertId: "user_expert_3",
    clientId: PAST_CLIENT_1_ID,
    category: "Finance & Capital",
    title: "Preparing our data room for Series A",
    challenge: "We were about to raise our first institutional round with no data room and messy financials.",
    comment: "Daniel's fundraising experience showed immediately — he knew exactly what investors would ask.",
    rating: 5,
    day: 27,
  },
  {
    id: "15",
    expertId: "user_expert_3",
    clientId: PAST_CLIENT_2_ID,
    category: "Finance & Capital",
    title: "Building a 3-year financial model",
    challenge: "Our finance function was still spreadsheet-only and investors wanted a real model.",
    comment: "Clear, no-nonsense advice on what actually matters to investors.",
    rating: 4,
    day: 28,
  },
  {
    id: "16",
    expertId: "user_expert_4",
    clientId: PAST_CLIENT_1_ID,
    category: "Digital & AI",
    title: "Piloting AI in a regulated clinical workflow",
    challenge: "We wanted to pilot AI tools in a clinical workflow without breaking compliance.",
    comment: "Sofia understood the regulatory constraints better than most technologists we'd spoken to.",
    rating: 5,
    day: 23,
  },
  {
    id: "17",
    expertId: "user_expert_4",
    clientId: PAST_CLIENT_2_ID,
    category: "Digital & AI",
    title: "Getting clinicians to actually adopt new software",
    challenge: "We rolled out new software but adoption among clinical staff stalled.",
    comment: "Practical change-management advice, not just a technology pitch.",
    rating: 5,
    day: 24,
  },
  {
    id: "18",
    expertId: "user_expert_5",
    clientId: PAST_CLIENT_1_ID,
    category: "Partnerships",
    title: "Structuring our first reseller partnership",
    challenge: "We had inbound interest from a reseller but no idea how to structure the deal.",
    comment: "Liam had clearly done this many times — the deal structure advice saved us weeks.",
    rating: 5,
    day: 25,
  },
  {
    id: "19",
    expertId: "user_expert_5",
    clientId: PAST_CLIENT_2_ID,
    category: "Partnerships",
    title: "Untangling an underperforming channel partnership",
    challenge: "One of our channel partnerships wasn't delivering and we didn't know whether to fix it or exit.",
    comment: "Direct and pragmatic — helped us make a decision we'd been avoiding.",
    rating: 4,
    day: 26,
  },
  {
    id: "20",
    expertId: "user_expert_6",
    clientId: PAST_CLIENT_1_ID,
    category: "Governance",
    title: "Preparing board materials for our first institutional investor",
    challenge: "We were adding our first institutional board seat and had no formal board process.",
    comment: "Naomi's governance experience was obvious immediately — calm, precise, and very reassuring.",
    rating: 5,
    day: 27,
  },
  {
    id: "21",
    expertId: "user_expert_7",
    clientId: PAST_CLIENT_1_ID,
    category: "People & Culture",
    title: "Rebuilding culture after rapid frontline hiring",
    challenge: "We tripled frontline headcount in a year and culture became inconsistent site to site.",
    comment: "Ethan's frontline experience really showed — practical, not theoretical.",
    rating: 5,
    day: 28,
  },
  {
    id: "22",
    expertId: "user_expert_7",
    clientId: PAST_CLIENT_2_ID,
    category: "People & Culture",
    title: "Improving engagement among distributed site teams",
    challenge: "Engagement scores were falling across our distributed site teams and we didn't know why.",
    comment: "He asked better questions than our own HR team had.",
    rating: 5,
    day: 29,
  },
  {
    id: "23",
    expertId: "user_expert_8",
    clientId: PAST_CLIENT_1_ID,
    category: "Operations",
    title: "Rebuilding safety culture after a serious incident",
    challenge: "We had a serious safety incident and needed to rebuild trust in our safety culture fast.",
    comment: "Grace has clearly lived this — steady, direct, and exactly what we needed.",
    rating: 5,
    day: 23,
  },
  {
    id: "24",
    expertId: "user_expert_8",
    clientId: PAST_CLIENT_2_ID,
    category: "Leadership",
    title: "Developing frontline supervisors into real leaders",
    challenge: "Our frontline supervisors were promoted for technical skill but had no leadership training.",
    comment: "Practical leadership advice grounded in real field experience.",
    rating: 5,
    day: 24,
  },
];

export const historicalProjects: Project[] = ROWS.map((row) => ({
  id: `project_${row.id}`,
  clientId: row.clientId,
  title: row.title,
  challenge: row.challenge,
  category: row.category,
  status: "completed",
  matchedExpertIds: [row.expertId],
  consultationId: `consultation_${row.id}`,
  activity: [
    { id: `act_${row.id}a`, label: "Challenge submitted", timestamp: d(row.day) },
    { id: `act_${row.id}b`, label: "Consultation completed", timestamp: d(row.day) },
  ],
  createdAt: d(row.day),
  updatedAt: d(row.day),
}));

export const historicalConsultations: Consultation[] = ROWS.map((row) => ({
  id: `consultation_${row.id}`,
  projectId: `project_${row.id}`,
  clientId: row.clientId,
  expertId: row.expertId,
  scheduledFor: d(row.day),
  status: "completed",
  recordingConsent: true,
  durationSeconds: 1800,
  createdAt: d(row.day),
}));

export const historicalReviews: Review[] = ROWS.map((row) => ({
  id: `review_${row.id}`,
  consultationId: `consultation_${row.id}`,
  fromUserId: row.clientId,
  toUserId: row.expertId,
  usefulness: row.rating,
  understanding: row.rating,
  rating: row.rating,
  comment: row.comment,
  createdAt: d(row.day),
}));
