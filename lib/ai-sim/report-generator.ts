import type { Brief, Report } from "@/lib/types";
import type { Category } from "@/lib/constants/categories";

type ReportTemplate = {
  considerations: string[];
  directions: string[];
  frameworks: string[];
  risks: string[];
  resources: string[];
};

const DEFAULT_TEMPLATE: ReportTemplate = {
  considerations: [
    "The most durable fixes usually change the system that produced the problem, not just its symptoms.",
    "Whoever has the authority to act should be closely involved in shaping the plan, not just receiving it.",
  ],
  directions: [
    "Start with the smallest change that could meaningfully test the theory of the problem.",
    "Sequence changes so early wins build the case for larger ones.",
  ],
  frameworks: ["Root-cause analysis", "90-day pilot framework"],
  risks: ["Moving straight to a full rollout without testing the approach first."],
  resources: ["Change management checklist"],
};

const CATEGORY_TEMPLATES: Partial<Record<Category, ReportTemplate>> = {
  Talent: {
    considerations: [
      "Compliance-based tracking often crowds out intrinsic motivation.",
      "Manager involvement is usually the strongest lever for sustained engagement.",
      "Ownership tends to increase when people help shape their own goals.",
    ],
    directions: [
      "Shift from centrally-tracked requirements to self-authored plans reviewed by managers.",
      "Introduce peer accountability instead of top-down reminders.",
      "Make progress visible in regular conversations without new compensation mechanics.",
    ],
    frameworks: ["70-20-10 development model", "Manager-as-coach framework"],
    risks: ["Redesigning without manager buy-in tends to repeat the same failure."],
    resources: ["Self-directed development plan template", "Manager coaching conversation guide"],
  },
  Leadership: {
    considerations: [
      "Shared decision rights build trust faster than shared social experiences alone.",
      "Leadership alignment issues usually show up in how decisions get made, not just how people feel.",
    ],
    directions: [
      "Redesign decision rights so collaboration is structurally required, not optional.",
      "Pair leaders on shared initiatives with joint accountability.",
    ],
    frameworks: ["RACI for leadership decision rights"],
    risks: ["A single offsite or workshop rarely survives contact with real day-to-day decisions."],
    resources: ["Leadership alignment checklist"],
  },
  "People & Culture": {
    considerations: [
      "Trust rebuilds through consistent small actions, not one large gesture.",
      "Manager-level communication usually matters more than company-wide broadcasts.",
    ],
    directions: [
      "Shift from one-off broadcasts to a recurring cadence of smaller, manager-led conversations.",
      "Create a visible channel for people to see decisions acted on, not just explained.",
    ],
    frameworks: ["Trust recovery communication cadence"],
    risks: ["A second underwhelming broad announcement could deepen distrust rather than repair it."],
    resources: ["Manager communication cadence template"],
  },
  Operations: {
    considerations: [
      "The fastest path to standardized process is documenting what already works, not designing from scratch.",
      "Inconsistency across teams/shifts is usually a training and handoff issue, not a process design issue.",
    ],
    directions: [
      "Run a rapid documentation sprint capturing current best practice from your strongest team or site.",
      "Build a lightweight template others can adapt rather than author from scratch.",
    ],
    frameworks: ["SOP documentation sprint methodology"],
    risks: ["Waiting for a perfect process before documenting will blow through tight timelines."],
    resources: ["SOP template pack", "Handoff checklist template"],
  },
  "Finance & Capital": {
    considerations: [
      "Investor-grade reporting is a process change, not a one-time cleanup.",
      "Forecasting credibility comes from a track record of hitting a small number of committed metrics.",
    ],
    directions: [
      "Stand up monthly close discipline before building a forward-looking model.",
      "Pick 3-5 core metrics and report them consistently before adding complexity.",
    ],
    frameworks: ["Monthly close checklist", "Driver-based forecasting model"],
    risks: ["Presenting an overly complex model erodes credibility more than a simple, consistent one."],
    resources: ["Investor data room checklist"],
  },
  "Market Expansion": {
    considerations: [
      "Market selection should weight regulatory complexity and partnership availability, not just size.",
      "A single well-chosen pilot market de-risks the broader regional bet.",
    ],
    directions: [
      "Select one pilot market based on regulatory ease and partner availability, not raw market size.",
      "Structure entry as a lightweight partnership before committing to a full local entity.",
    ],
    frameworks: ["Market entry mode framework", "CAGE distance framework"],
    risks: ["Committing to a full local entity too early increases cost and reduces optionality."],
    resources: ["Market entry regulatory overview", "Partnership structuring checklist"],
  },
  "Digital & AI": {
    considerations: [
      "Adoption usually fails on workflow fit, not on the underlying technology.",
      "Small, visible wins build more support than a single large transformation program.",
    ],
    directions: [
      "Pilot on one well-scoped workflow before expanding.",
      "Pair every new tool with a named owner accountable for adoption, not just rollout.",
    ],
    frameworks: ["Technology adoption curve", "Pilot-then-scale rollout model"],
    risks: ["A big-bang rollout without a pilot tends to generate resistance rather than adoption."],
    resources: ["Digital adoption playbook"],
  },
  Governance: {
    considerations: [
      "Diligence typically checks for structure and documentation, not scale.",
      "Retrofitting governance under diligence pressure signals immaturity to investors.",
    ],
    directions: [
      "Formalize board cadence with documented minutes.",
      "Stand up minimal committees now, in a form that can grow with the company.",
    ],
    frameworks: ["Governance maturity ladder for growth-stage companies"],
    risks: ["Waiting until diligence starts to build this out costs credibility with investors."],
    resources: ["Board governance starter checklist"],
  },
  Partnerships: {
    considerations: [
      "The strongest partnerships start with a narrow, provable use case, not a broad agreement.",
      "Clear ownership on both sides prevents partnerships from stalling after signature.",
    ],
    directions: [
      "Structure an initial narrow pilot with a clear success metric before a broader agreement.",
      "Name a single accountable owner on each side.",
    ],
    frameworks: ["Partnership scorecard"],
    risks: ["Broad agreements without a proof point tend to stall before delivering value."],
    resources: ["Partnership structuring checklist"],
  },
  Strategy: DEFAULT_TEMPLATE,
};

export function generateReport(
  brief: Brief,
  category: string,
): Omit<Report, "id" | "projectId" | "createdAt" | "updatedAt"> {
  const template = CATEGORY_TEMPLATES[category as Category] ?? DEFAULT_TEMPLATE;

  return {
    status: "ready",
    category,
    problemSummary: `${brief.situation} The core tension is between ${brief.objective.toLowerCase()} and the constraint that ${brief.constraints.toLowerCase()}`,
    keyConsiderations: template.considerations,
    strategicDirections: template.directions,
    frameworks: template.frameworks,
    risks: template.risks,
    resources: template.resources,
    sections: [
      {
        heading: "Why this is happening",
        body: `${brief.situation} Given what's already been tried — ${brief.existingActions.toLowerCase()} — the underlying issue looks more structural than a matter of effort.`,
      },
      {
        heading: "What tends to work",
        body: template.directions.join(" "),
      },
    ],
  };
}
