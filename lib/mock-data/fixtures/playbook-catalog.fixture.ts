import type { Playbook, PlaybookTemplate } from "@/lib/types";

const WHATS_INCLUDED = [
  "Executive Summary",
  "Key Insights",
  "Recommended Actions",
  "Practical Frameworks",
  "Expert Input",
  "Resources & References",
];

export const PLAYBOOK_TEMPLATES: PlaybookTemplate[] = [
  {
    id: "tpl_market_expansion",
    title: "Market Expansion Playbook",
    description:
      "A practical guide for evaluating markets, choosing an entry strategy, and planning execution.",
    category: "Market Expansion",
    price: 75000,
    whatsIncluded: WHATS_INCLUDED,
  },
  {
    id: "tpl_leadership_team",
    title: "Leadership Team Playbook",
    description: "Guidance for building, structuring, and strengthening a senior leadership team.",
    category: "Leadership",
    price: 75000,
    whatsIncluded: WHATS_INCLUDED,
  },
  {
    id: "tpl_growth_capital",
    title: "Growth Capital Playbook",
    description: "Frameworks for evaluating fundraising, capital requirements, and growth trade-offs.",
    category: "Finance & Capital",
    price: 75000,
    whatsIncluded: WHATS_INCLUDED,
  },
  {
    id: "tpl_operations_scaling",
    title: "Operations Scaling Playbook",
    description: "Practical approaches to scaling operations without losing efficiency.",
    category: "Operations",
    price: 75000,
    whatsIncluded: WHATS_INCLUDED,
  },
  {
    id: "tpl_strategic_partnerships",
    title: "Strategic Partnerships Playbook",
    description: "Guidance for evaluating, structuring, and managing strategic partnerships.",
    category: "Partnerships",
    price: 75000,
    whatsIncluded: WHATS_INCLUDED,
  },
  {
    id: "tpl_founder_transition",
    title: "Founder Transition Playbook",
    description: "Practical guidance for succession, leadership transition, and continuity.",
    category: "Governance",
    price: 75000,
    whatsIncluded: WHATS_INCLUDED,
  },
];

type CatalogContent = Omit<Playbook, "id" | "projectId" | "createdAt" | "updatedAt" | "expertContributionIds">;

/**
 * The real generated content for each template — kept out of PlaybookTemplate
 * so nothing here can leak through a locked card. Only unlockTemplate() in
 * lib/api/playbook-catalog.ts reads this, and only after a purchase.
 */
export const PLAYBOOK_TEMPLATE_CONTENT: Record<string, CatalogContent> = {
  tpl_market_expansion: {
    title: "Market Expansion Playbook",
    status: "ready",
    version: 1,
    executiveSummary:
      "A structured approach to entering a new market: how to size the opportunity, choose an entry model, and sequence the first six months without overcommitting resources before you have real signal.",
    keyInsights: [
      "Most failed market entries fail on sequencing, not strategy — teams commit to hiring and infrastructure before they've validated demand.",
      "A narrow, well-chosen beachhead outperforms a broad simultaneous launch in nearly every case.",
      "Regulatory and distribution constraints are usually the real gating factor, not competitive intensity.",
    ],
    recommendedStrategy:
      "Pick one segment or region as a beachhead, validate it with a lightweight local presence before building permanent infrastructure, and set explicit go/no-go criteria before expanding further.",
    actionItems: [
      {
        id: "action_0",
        title: "Size the opportunity and shortlist 2-3 candidate markets",
        description: "Score candidate markets on demand signal, regulatory complexity, and distribution access.",
        owner: "client",
        timeframe: "Next 2 weeks",
        status: "not_started",
      },
      {
        id: "action_1",
        title: "Choose an entry model and define the beachhead",
        description: "Decide between direct entry, partnership, or licensing, and pick the first narrow segment to prove.",
        owner: "client",
        timeframe: "Next 4-6 weeks",
        status: "not_started",
      },
      {
        id: "action_2",
        title: "Set go/no-go criteria for scaling the entry",
        description: "Define the metrics that determine whether to invest further or pull back.",
        owner: "client",
        timeframe: "Next quarter",
        status: "not_started",
      },
    ],
    frameworks: ["Market sizing (TAM/SAM/SOM)", "Entry-mode decision matrix", "Beachhead segmentation"],
    risks: [
      "Underestimating local regulatory or compliance requirements.",
      "Over-investing in infrastructure before demand is validated.",
      "Misreading distribution dynamics that differ from your home market.",
    ],
    successMeasures: ["Validated demand signal in the beachhead segment within one quarter", "Clear go/no-go decision made before further investment"],
    resources: ["Market entry checklist", "Regulatory research template", "Go/no-go scorecard"],
    sections: [
      {
        heading: "Expert input",
        body: "Operators who've run market entries consistently flag the same failure mode: committing to headcount and infrastructure before demand is proven. Treat the first market as an experiment with a defined budget and timeline, not a permanent bet.",
      },
    ],
  },

  tpl_leadership_team: {
    title: "Leadership Team Playbook",
    status: "ready",
    version: 1,
    executiveSummary:
      "A practical approach to diagnosing gaps in a leadership team, deciding what to build versus hire for, and establishing the operating rhythms that turn a group of senior people into an actual team.",
    keyInsights: [
      "Most leadership-team problems are structural (unclear decision rights, missing functions) rather than personality conflicts.",
      "Teams that operate well share a small set of rhythms: a regular cadence, clear decision rights, and shared metrics.",
      "Hiring a senior leader too early to 'fix' a function often masks a strategy gap that hiring alone won't solve.",
    ],
    recommendedStrategy:
      "Map current leadership coverage against what the business actually needs over the next 12 months, close the highest-leverage gap first, and install a lightweight operating rhythm before adding more people.",
    actionItems: [
      {
        id: "action_0",
        title: "Map current coverage against the next 12 months' needs",
        description: "Identify which functions are genuinely under-resourced versus just uncomfortable.",
        owner: "client",
        timeframe: "Next 2 weeks",
        status: "not_started",
      },
      {
        id: "action_1",
        title: "Define decision rights across the team",
        description: "Clarify who owns which decisions to reduce escalation and duplicated work.",
        owner: "client",
        timeframe: "Next 4-6 weeks",
        status: "not_started",
      },
      {
        id: "action_2",
        title: "Install a leadership operating rhythm",
        description: "Set a regular cadence with shared metrics and clear follow-through.",
        owner: "client",
        timeframe: "Next quarter",
        status: "not_started",
      },
    ],
    frameworks: ["Leadership coverage map", "Decision-rights matrix", "Operating rhythm design"],
    risks: [
      "Hiring to fix a strategy gap rather than a genuine capacity gap.",
      "Adding senior headcount without first fixing decision rights.",
      "Letting the team default to consensus on decisions that need a single owner.",
    ],
    successMeasures: ["A documented decision-rights map the team actually references", "A regular leadership cadence running for one full quarter"],
    resources: ["Leadership coverage template", "Decision-rights worksheet"],
    sections: [
      {
        heading: "Expert input",
        body: "Experienced operators tend to fix decision rights before they touch headcount — a team with clear ownership often performs well even one person short, while an unclear team stays dysfunctional no matter how many people you add.",
      },
    ],
  },

  tpl_growth_capital: {
    title: "Growth Capital Playbook",
    status: "ready",
    version: 1,
    executiveSummary:
      "A framework for deciding whether, when, and how much capital to raise — grounded in what the business actually needs to execute its next stage, not what the market will offer.",
    keyInsights: [
      "The right raise size is set by the milestones you need to hit before the next round, not by what investors are willing to offer.",
      "Diligence readiness (clean financials, a coherent model) is usually the actual bottleneck, not investor interest.",
      "Non-dilutive and structured options are frequently underused relative to their fit for the situation.",
    ],
    recommendedStrategy:
      "Work backward from the milestones the business needs to hit before the next raise, size the round to fund that with a buffer, and get diligence materials in order before starting conversations.",
    actionItems: [
      {
        id: "action_0",
        title: "Define the milestones the next round needs to fund",
        description: "Work backward from what needs to be true before a future raise.",
        owner: "client",
        timeframe: "Next 2 weeks",
        status: "not_started",
      },
      {
        id: "action_1",
        title: "Build the diligence-ready data room",
        description: "Clean up financials and prepare the documents investors will actually ask for.",
        owner: "client",
        timeframe: "Next 4-6 weeks",
        status: "not_started",
      },
      {
        id: "action_2",
        title: "Evaluate structured and non-dilutive options",
        description: "Compare against a straight equity raise before committing to a structure.",
        owner: "client",
        timeframe: "Next quarter",
        status: "not_started",
      },
    ],
    frameworks: ["Milestone-based raise sizing", "Diligence readiness checklist", "Capital structure comparison"],
    risks: [
      "Raising more than the milestones actually require, diluting unnecessarily.",
      "Starting investor conversations before the data room is ready.",
      "Overlooking structured or non-dilutive alternatives that fit better.",
    ],
    successMeasures: ["A raise sized to funded milestones, not market appetite", "A complete data room ready before first investor conversations"],
    resources: ["Data room checklist", "Financial model template", "Capital structure comparison sheet"],
    sections: [
      {
        heading: "Expert input",
        body: "Investors consistently cite disorganized financials as the top reason diligence stalls — most of the delay in closing a round is self-inflicted and avoidable with preparation done well before the first pitch.",
      },
    ],
  },

  tpl_operations_scaling: {
    title: "Operations Scaling Playbook",
    status: "ready",
    version: 1,
    executiveSummary:
      "A practical approach to scaling operations — where to standardize, where to leave room for local judgment, and how to avoid the efficiency losses that usually show up as headcount grows.",
    keyInsights: [
      "Efficiency losses during scaling usually trace back to undocumented processes that lived in one person's head.",
      "Standardizing too early can be as costly as standardizing too late — the trick is sequencing what to lock down first.",
      "The highest-leverage fix is usually a repeatable playbook for the most frequent operational decision, not a new tool.",
    ],
    recommendedStrategy:
      "Document the two or three processes with the highest variance and frequency first, standardize those, and leave lower-frequency decisions to local judgment until volume justifies locking them down too.",
    actionItems: [
      {
        id: "action_0",
        title: "Identify the highest-variance, highest-frequency processes",
        description: "Find where inconsistency is actually costing time or quality today.",
        owner: "client",
        timeframe: "Next 2 weeks",
        status: "not_started",
      },
      {
        id: "action_1",
        title: "Document and standardize the top processes",
        description: "Turn tribal knowledge into a repeatable playbook the team can follow.",
        owner: "client",
        timeframe: "Next 4-6 weeks",
        status: "not_started",
      },
      {
        id: "action_2",
        title: "Set review checkpoints as volume grows",
        description: "Revisit what needs standardizing next as the team scales further.",
        owner: "client",
        timeframe: "Next quarter",
        status: "not_started",
      },
    ],
    frameworks: ["Process variance mapping", "Standardization sequencing", "Operating cadence design"],
    risks: [
      "Standardizing low-frequency processes before the high-impact ones.",
      "Losing operational knowledge when a key person leaves before it's documented.",
      "Over-engineering process before volume actually justifies it.",
    ],
    successMeasures: ["Documented playbooks for the top 2-3 highest-variance processes", "Reduced escalations on previously undocumented decisions"],
    resources: ["Process documentation template", "Standardization prioritization worksheet"],
    sections: [
      {
        heading: "Expert input",
        body: "Operators who've scaled teams past this stage tend to document the messiest process first, not the easiest — the highest-variance process is usually where inefficiency compounds fastest as headcount grows.",
      },
    ],
  },

  tpl_strategic_partnerships: {
    title: "Strategic Partnerships Playbook",
    status: "ready",
    version: 1,
    executiveSummary:
      "A framework for evaluating potential partnerships, structuring the deal so incentives stay aligned, and managing the relationship once it's live so it doesn't quietly stall.",
    keyInsights: [
      "Partnerships fail more often from unclear mutual incentives than from a bad initial fit.",
      "The strongest partnerships have a single accountable owner on each side, not a committee.",
      "Most partnership value is lost in the first 90 days if there's no structured onboarding for the relationship itself.",
    ],
    recommendedStrategy:
      "Evaluate fit against explicit mutual-incentive criteria before structuring terms, name a single accountable owner on each side, and run a structured first-90-days plan rather than assuming momentum will carry it.",
    actionItems: [
      {
        id: "action_0",
        title: "Evaluate partnership fit against mutual-incentive criteria",
        description: "Confirm both sides genuinely benefit before investing in structuring the deal.",
        owner: "client",
        timeframe: "Next 2 weeks",
        status: "not_started",
      },
      {
        id: "action_1",
        title: "Structure the agreement and name an accountable owner",
        description: "Define terms and assign a single owner on each side, not a committee.",
        owner: "client",
        timeframe: "Next 4-6 weeks",
        status: "not_started",
      },
      {
        id: "action_2",
        title: "Run a structured first-90-days plan",
        description: "Set explicit milestones for the relationship's early momentum.",
        owner: "client",
        timeframe: "Next quarter",
        status: "not_started",
      },
    ],
    frameworks: ["Mutual-incentive fit assessment", "Partnership structuring checklist", "First-90-days plan"],
    risks: [
      "Assuming initial enthusiasm will substitute for a structured plan.",
      "Leaving ownership diffuse across a committee instead of one accountable person.",
      "Underestimating the operational lift required to activate the partnership.",
    ],
    successMeasures: ["A named accountable owner on both sides within the first month", "Defined milestones hit within the first 90 days"],
    resources: ["Partnership fit assessment template", "First-90-days plan template"],
    sections: [
      {
        heading: "Expert input",
        body: "The partnerships that hold up over time almost always have one clearly accountable person per side — the ones that stall tend to have shared ownership that, in practice, means no one is actually driving it.",
      },
    ],
  },

  tpl_founder_transition: {
    title: "Founder Transition Playbook",
    status: "ready",
    version: 1,
    executiveSummary:
      "Practical guidance for planning a leadership transition — what to formalize before stepping back, how to prepare the team and the business, and how to preserve continuity through the handover.",
    keyInsights: [
      "Transitions that are planned over a defined runway succeed far more often than reactive, sudden handovers.",
      "The biggest continuity risk is usually undocumented decision-making that lived entirely with the founder.",
      "A successor benefits far more from a defined transition period with shared decision-making than from being handed full authority on day one.",
    ],
    recommendedStrategy:
      "Set a defined transition runway, document the decisions and relationships that currently depend on you personally, and hand over authority in stages rather than all at once.",
    actionItems: [
      {
        id: "action_0",
        title: "Set a defined transition runway and milestones",
        description: "Give the transition a real timeline rather than an open-ended handover.",
        owner: "client",
        timeframe: "Next 2 weeks",
        status: "not_started",
      },
      {
        id: "action_1",
        title: "Document founder-dependent decisions and relationships",
        description: "Capture what currently depends on you personally before handing it over.",
        owner: "client",
        timeframe: "Next 4-6 weeks",
        status: "not_started",
      },
      {
        id: "action_2",
        title: "Hand over authority in defined stages",
        description: "Transfer decision-making incrementally with clear checkpoints.",
        owner: "client",
        timeframe: "Next quarter",
        status: "not_started",
      },
    ],
    frameworks: ["Transition runway planning", "Founder-dependency mapping", "Staged authority handover"],
    risks: [
      "Handing over full authority before the successor has run key decisions with support.",
      "Leaving founder-dependent relationships and decisions undocumented.",
      "Treating the transition as a single event rather than a staged process.",
    ],
    successMeasures: ["A documented map of founder-dependent decisions and relationships", "Successor independently running key decisions before the transition completes"],
    resources: ["Transition runway template", "Founder-dependency mapping worksheet"],
    sections: [
      {
        heading: "Expert input",
        body: "Founders who've been through a transition consistently point to the same lesson: document what only you know well before you need to, and hand over real decisions in stages so the successor is tested with support rather than thrown in cold.",
      },
    ],
  },
};
