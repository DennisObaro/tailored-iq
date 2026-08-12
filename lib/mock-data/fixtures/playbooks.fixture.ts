import type { Playbook, ExpertContribution } from "@/lib/types";
import { DEMO_EXPERT_ID } from "./users.fixture";

const d = (day: number) => `2026-07-${String(day).padStart(2, "0")}T10:00:00.000Z`;

export const seedPlaybooks: Playbook[] = [
  {
    id: "playbook_1",
    projectId: "project_1",
    title: "Talent Retention Playbook",
    status: "ready",
    version: 1,
    executiveSummary:
      "Trainees disengage from development because the current program rewards compliance, not ownership. Shifting to self-authored development plans with light manager coaching addresses this without new budget or comp changes.",
    keyInsights: [
      "Completion tracking measures compliance, not engagement.",
      "Ownership increases sharply when trainees co-author their own goals.",
      "Manager coaching check-ins outperform reminder emails.",
    ],
    recommendedStrategy:
      "Redesign the program around trainee-authored development plans, reviewed monthly by managers, with lightweight peer cohort accountability.",
    actionItems: [
      {
        id: "action_1a",
        title: "Replace tracked modules with self-authored development plans",
        description: "Have each trainee draft a 90-day development plan with 2-3 concrete goals, reviewed (not dictated) by their manager.",
        owner: "client",
        timeframe: "Next 2 weeks",
        status: "done",
      },
      {
        id: "action_1b",
        title: "Introduce monthly manager coaching check-ins",
        description: "30-minute structured conversation tied to the trainee's plan — progress, blockers, and one adjustment.",
        owner: "client",
        timeframe: "Next 4 weeks",
        status: "done",
      },
      {
        id: "action_1c",
        title: "Set up peer cohort accountability groups",
        description: "Group trainees into small peer cohorts that check in on each other's progress biweekly.",
        owner: "client",
        timeframe: "Next 6 weeks",
        status: "in_progress",
      },
      {
        id: "action_1d",
        title: "Review engagement after one full cycle",
        description: "Measure voluntary participation and manager-reported engagement after the first 90-day cycle.",
        owner: "client",
        timeframe: "Next quarter",
        status: "not_started",
      },
    ],
    frameworks: ["70-20-10 development model", "Manager-as-coach framework"],
    risks: ["Redesign will underperform without genuine manager buy-in — invest in manager coaching skills first."],
    successMeasures: ["Voluntary plan participation rate", "Manager-reported engagement", "90-day plan completion rate"],
    resources: ["Self-directed development plan template", "Manager coaching conversation guide"],
    sections: [
      {
        heading: "Expert input",
        body: "Marcus emphasized starting with manager coaching skill-building before rolling out self-authored plans broadly — without it, managers default back to a checklist mindset.",
      },
    ],
    expertContributionIds: ["contribution_1"],
    createdAt: d(6),
    updatedAt: d(6),
  },
  {
    id: "playbook_6",
    projectId: "project_6",
    title: "Governance Readiness Playbook",
    status: "ready",
    version: 1,
    executiveSummary:
      "A minimal but credible governance baseline — formal board cadence, a lightweight audit committee, and documented decision rights — will satisfy Series C diligence without slowing the company down.",
    keyInsights: [
      "Diligence checks for structure and documentation, not scale.",
      "Retrofitting governance under diligence pressure signals immaturity.",
    ],
    recommendedStrategy:
      "Stand up the minimum credible governance structure now, in a form that can grow with the company post-raise.",
    actionItems: [
      {
        id: "action_6a",
        title: "Formalize board meeting cadence and minutes",
        description: "Move to a documented quarterly board cadence with formal minutes and action tracking.",
        owner: "client",
        timeframe: "Next 3 weeks",
        status: "not_started",
      },
      {
        id: "action_6b",
        title: "Stand up a minimal audit committee",
        description: "Two board members plus the CFO, meeting before each quarterly board meeting.",
        owner: "client",
        timeframe: "Next 4 weeks",
        status: "not_started",
      },
      {
        id: "action_6c",
        title: "Document delegation of authority and decision rights",
        description: "A one-page document clarifying what founders vs. the board can approve unilaterally.",
        owner: "client",
        timeframe: "Next 6 weeks",
        status: "not_started",
      },
    ],
    frameworks: ["Governance maturity ladder for growth-stage companies"],
    risks: ["Waiting until diligence starts to build this out costs credibility with investors."],
    successMeasures: ["Governance checklist completion ahead of first diligence call"],
    resources: ["Board governance starter checklist"],
    sections: [],
    expertContributionIds: ["contribution_6"],
    createdAt: d(7),
    updatedAt: d(7),
  },
  {
    id: "playbook_7",
    projectId: "project_7",
    title: "Leadership Alignment Playbook",
    status: "generating",
    version: 1,
    executiveSummary: "",
    keyInsights: [],
    recommendedStrategy: "",
    actionItems: [],
    frameworks: [],
    risks: [],
    successMeasures: [],
    resources: [],
    sections: [],
    expertContributionIds: [],
    createdAt: d(20),
    updatedAt: d(20),
  },
];

export const seedContributions: ExpertContribution[] = [
  {
    id: "contribution_1",
    expertId: DEMO_EXPERT_ID,
    projectId: "project_1",
    playbookId: "playbook_1",
    type: "playbook_input",
    content:
      "Before rolling out self-authored plans broadly, invest a short session in manager coaching skills. Without it, managers default back to a checklist mindset and the redesign underperforms.",
    status: "published",
    createdAt: d(6),
  },
  {
    id: "contribution_6",
    expertId: "user_expert_6",
    projectId: "project_6",
    playbookId: "playbook_6",
    type: "playbook_input",
    content:
      "Keep the audit committee to two board members plus the CFO initially — investors care more that it exists and meets consistently than about its size.",
    status: "published",
    createdAt: d(7),
  },
];
