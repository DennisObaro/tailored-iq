import type { Report } from "@/lib/types";

const d = (day: number) => `2026-07-${String(day).padStart(2, "0")}T10:00:00.000Z`;

export const seedReports: Report[] = [
  {
    id: "report_1",
    projectId: "project_1",
    status: "ready",
    category: "Talent",
    problemSummary:
      "Trainees comply with tracked requirements but don't take ownership of their own development — a common pattern when programs are designed around compliance rather than agency.",
    keyConsiderations: [
      "Compliance-based tracking often crowds out intrinsic motivation.",
      "Manager involvement is usually the strongest lever for sustained engagement.",
      "Ownership tends to increase when trainees help shape their own development goals.",
    ],
    strategicDirections: [
      "Shift from centrally-tracked modules to trainee-authored development plans reviewed by managers.",
      "Introduce peer accountability structures (cohort check-ins) instead of top-down reminders.",
      "Make development visible in performance conversations without adding new compensation mechanics.",
    ],
    frameworks: ["70-20-10 development model", "Manager-as-coach framework"],
    risks: [
      "Redesigning the program without manager buy-in will likely repeat the same failure.",
      "Too much autonomy too fast can feel like abandonment rather than empowerment.",
    ],
    resources: ["Sample self-directed development plan template", "Manager coaching conversation guide"],
    sections: [
      {
        heading: "Why compliance tracking isn't working",
        body: "Completion tracking optimizes for the wrong signal — it measures whether a module was opened, not whether learning changed behavior. Trainees quickly learn to satisfy the metric without engaging with the substance.",
      },
      {
        heading: "What tends to work instead",
        body: "Programs that shift ownership to the participant — through self-authored goals, manager coaching conversations, and peer cohorts — see meaningfully higher follow-through, even without new budget.",
      },
    ],
    createdAt: d(2),
    updatedAt: d(2),
  },
  {
    id: "report_2",
    projectId: "project_2",
    status: "ready",
    category: "Market Expansion",
    problemSummary:
      "Entering Southeast Asia from zero local presence is a sequencing problem as much as a strategy problem — the right first market and entry model matter more than the overall regional thesis.",
    keyConsiderations: [
      "Market selection should weight regulatory complexity and required local partnerships, not just market size.",
      "A single well-chosen pilot market de-risks the broader regional bet.",
      "Board-ready plans benefit from explicit 90/180/365-day milestones tied to a small dedicated team.",
    ],
    strategicDirections: [
      "Select one pilot market based on regulatory ease and partner availability, not raw TAM.",
      "Structure entry as a lightweight local partnership rather than a full local entity initially.",
      "Define clear go/no-go milestones before committing further investment.",
    ],
    frameworks: ["Market entry mode framework (export / partner / subsidiary)", "CAGE distance framework"],
    risks: [
      "Choosing a market by size alone often ignores regulatory and partnership friction.",
      "Committing to a full local entity too early increases cost and reduces optionality.",
    ],
    resources: ["Southeast Asia regulatory complexity overview", "Partnership structuring checklist"],
    sections: [
      {
        heading: "Picking the right first market",
        body: "The most successful regional entries typically start with the market that offers the fastest path to a credible proof point, not necessarily the largest overall opportunity.",
      },
    ],
    createdAt: d(9),
    updatedAt: d(9),
  },
  {
    id: "report_3",
    projectId: "project_3",
    status: "ready",
    category: "Operations",
    problemSummary:
      "Undocumented, tribal-knowledge-based processes are a common failure point when scaling from one site to several — the fix is capturing what already works, not reinventing it.",
    keyConsiderations: [
      "The fastest path to standardized SOPs is documenting your best-performing site first, not designing from scratch.",
      "Shift-to-shift inconsistency is usually a training and handoff issue, not a process design issue.",
      "8-week timelines favor a lightweight documentation sprint over a full redesign.",
    ],
    strategicDirections: [
      "Run a rapid documentation sprint capturing current best practice from your strongest shift/site.",
      "Build a lightweight SOP template that new sites can adapt rather than author from scratch.",
      "Introduce a shift handoff checklist to reduce knowledge loss between shifts.",
    ],
    frameworks: ["SOP documentation sprint methodology"],
    risks: ["Waiting for a perfect process before documenting will blow through the 8-week timeline."],
    resources: ["SOP template pack", "Shift handoff checklist template"],
    sections: [],
    createdAt: d(13),
    updatedAt: d(13),
  },
  {
    id: "report_6",
    projectId: "project_6",
    status: "ready",
    category: "Governance",
    problemSummary:
      "Institutional investors expect a credible governance baseline, but at this stage that means a few well-chosen structures, not a full board committee apparatus.",
    keyConsiderations: [
      "Series C diligence typically checks for a formal board, basic committees, and documented decision rights.",
      "Lightweight governance implemented early is far cheaper than governance retrofitted under diligence pressure.",
    ],
    strategicDirections: [
      "Formalize the board with clear meeting cadence and documented minutes.",
      "Stand up an audit committee even in minimal form before diligence begins.",
      "Document key decision rights and delegation of authority.",
    ],
    frameworks: ["Governance maturity ladder for growth-stage companies"],
    risks: ["Retrofitting governance during active diligence signals immaturity to investors."],
    resources: ["Board governance starter checklist"],
    sections: [],
    createdAt: d(4),
    updatedAt: d(4),
  },
  {
    id: "report_7",
    projectId: "project_7",
    status: "ready",
    category: "Leadership",
    problemSummary:
      "Post-merger leadership teams often default back to pre-merger loyalties unless decision-making structures — not just team-building — are redesigned.",
    keyConsiderations: [
      "A single offsite rarely survives contact with real day-to-day decisions.",
      "Shared decision rights build trust faster than shared social experiences alone.",
    ],
    strategicDirections: [
      "Redesign decision rights so cross-team collaboration is structurally required, not optional.",
      "Pair leaders across former teams on shared initiatives with joint accountability.",
    ],
    frameworks: ["RACI for merged leadership decision rights"],
    risks: ["Another one-off offsite without structural change will likely fail the same way."],
    resources: ["Post-merger leadership integration checklist"],
    sections: [],
    createdAt: d(19),
    updatedAt: d(19),
  },
  {
    id: "report_8",
    projectId: "project_8",
    status: "ready",
    category: "People & Culture",
    problemSummary:
      "Distrust after a restructuring typically isn't resolved by a single broadcast Q&A — it requires sustained, two-way communication over multiple cycles.",
    keyConsiderations: [
      "Trust rebuilds through consistent small actions, not one large gesture.",
      "Manager-level communication usually matters more than company-wide town halls.",
    ],
    strategicDirections: [
      "Shift from one-off all-hands to a recurring cadence of smaller, manager-led conversations.",
      "Create a visible channel for employees to see decisions acted on, not just explained.",
    ],
    frameworks: ["Trust recovery communication cadence"],
    risks: ["A second underwhelming all-hands could deepen distrust rather than repair it."],
    resources: ["Manager communication cadence template"],
    sections: [],
    createdAt: d(20),
    updatedAt: d(20),
  },
];
