import type {
  ExpertContributionPreference,
  ExpertContributionType,
  ExpertOnboardingStep,
  ExpertPointsSource,
  ExpertWillingness,
} from "@/lib/types";
import type { ExpertLevel } from "@/lib/types";

/* ------------------------------------------------------- what you can help with */

/**
 * Problem/outcome statements rather than subject labels (spec §7) — this
 * is what challenge-to-expert matching runs against, so each entry carries
 * the matching category it maps back to (lib/constants/categories.ts).
 * Configurable: adding a row here is all that's needed to offer a new one.
 */
export interface HelpArea {
  id: string;
  label: string;
  category: string;
}

export const HELP_AREA_GROUPS: { group: string; areas: HelpArea[] }[] = [
  {
    group: "Leadership",
    areas: [
      { id: "building_exec_teams", label: "Building executive teams", category: "Leadership" },
      { id: "leadership_development", label: "Leadership development", category: "Leadership" },
      { id: "succession_planning", label: "Succession planning", category: "Leadership" },
      { id: "first_time_leaders", label: "Developing first-time leaders", category: "Leadership" },
    ],
  },
  {
    group: "People",
    areas: [
      { id: "talent_retention", label: "Talent retention", category: "Talent" },
      { id: "org_restructuring", label: "Organisational restructuring", category: "People & Culture" },
      { id: "performance_management", label: "Performance management", category: "People & Culture" },
      { id: "culture_change", label: "Culture change", category: "People & Culture" },
      { id: "hiring_at_scale", label: "Hiring at scale", category: "Talent" },
    ],
  },
  {
    group: "Strategy",
    areas: [
      { id: "market_expansion", label: "Market expansion", category: "Market Expansion" },
      { id: "growth_strategy", label: "Growth strategy", category: "Strategy" },
      { id: "transformation", label: "Business transformation", category: "Strategy" },
      { id: "repositioning", label: "Repositioning after a setback", category: "Strategy" },
    ],
  },
  {
    group: "Operations",
    areas: [
      { id: "scaling_operations", label: "Scaling operations", category: "Operations" },
      { id: "process_design", label: "Process design", category: "Operations" },
      { id: "operating_models", label: "Operating models", category: "Operations" },
      { id: "cost_to_serve", label: "Reducing cost to serve", category: "Operations" },
    ],
  },
  {
    group: "Finance & Governance",
    areas: [
      { id: "fundraising", label: "Fundraising and capital strategy", category: "Finance & Capital" },
      { id: "financial_planning", label: "Financial planning and modelling", category: "Finance & Capital" },
      { id: "board_governance", label: "Board and governance setup", category: "Governance" },
      { id: "risk_compliance", label: "Risk and compliance", category: "Governance" },
    ],
  },
  {
    group: "Digital & Partnerships",
    areas: [
      { id: "ai_adoption", label: "Practical AI adoption", category: "Digital & AI" },
      { id: "digital_transformation", label: "Digital transformation", category: "Digital & AI" },
      { id: "partnership_structuring", label: "Structuring partnerships", category: "Partnerships" },
    ],
  },
];

export const HELP_AREAS: HelpArea[] = HELP_AREA_GROUPS.flatMap((g) => g.areas);

export function helpAreaLabel(id: string): string {
  return HELP_AREAS.find((a) => a.id === id)?.label ?? id;
}

/** Categories implied by an expert's selected help areas — feeds expert matching. */
export function categoriesForHelpAreas(ids: string[]): string[] {
  return Array.from(new Set(ids.map((id) => HELP_AREAS.find((a) => a.id === id)?.category).filter((c): c is string => !!c)));
}

/* ------------------------------------------------------- contribution preferences */

export const CONTRIBUTION_PREFERENCES: {
  key: ExpertContributionPreference;
  label: string;
  description: string;
}[] = [
  {
    key: "review_validate",
    label: "Review & validate",
    description: "Review TailoredIQ recommendations and strengthen them with your experience.",
  },
  {
    key: "advise_leaders",
    label: "Advise leaders",
    description: "Speak directly with leaders facing challenges you've experienced.",
  },
  {
    key: "playbook_contribution",
    label: "Contribute to playbooks",
    description: "Help strengthen practical solutions with your experience.",
  },
  {
    key: "share_insights",
    label: "Share insights",
    description: "Write practical insights, frameworks and lessons.",
  },
  {
    key: "case_studies",
    label: "Case studies",
    description: "Share what you've learned from real situations.",
  },
  {
    key: "expert_conversations",
    label: "Expert conversations",
    description: "Join recorded conversations, webinars or podcasts.",
  },
  {
    key: "thought_leadership",
    label: "Thought leadership",
    description: "Share existing professional work that can contribute to the knowledge base.",
  },
];

/** Contribution preference → the opportunity contribution types it unlocks. */
export const PREFERENCE_TO_WILLINGNESS: Record<ExpertContributionPreference, string[]> = {
  review_validate: ["review"],
  advise_leaders: ["advisory_call", "consulting_engagement"],
  playbook_contribution: ["playbook_contribution"],
  share_insights: ["contribute_insight"],
  case_studies: ["contribute_insight"],
  expert_conversations: [],
  thought_leadership: ["contribute_insight"],
};

export const CONTRIBUTION_TYPE_LABELS: Record<ExpertContributionType, string> = {
  insight: "Insight",
  review: "Recommendation review",
  playbook_input: "Playbook contribution",
  case_study: "Case study",
  topic_suggestion: "Suggested topic",
  thought_leadership: "Thought leadership",
  expert_conversation: "Expert conversation",
};

/** The short noun form, for badges and for summarising back what was picked. */
export const WILLINGNESS_LABELS: Record<string, string> = {
  review: "Review the recommendations",
  contribute_insight: "Contribute an insight",
  advisory_call: "Advisory call",
  playbook_contribution: "Playbook contribution",
  consulting_engagement: "Project support",
};

/**
 * The three ways an expert can engage with a client's challenge, in the
 * order they're offered.
 *
 * Deliberately not every ExpertWillingness value: `review` and
 * `contribute_insight` are knowledge-base work that reaches an expert
 * through the contributions hub, not through somebody's live challenge.
 * Mixing them in here made the choice read as a menu of chores rather than
 * a decision about how to help.
 *
 * Titles are phrased as actions because this is a choice the expert is
 * making. WILLINGNESS_LABELS keeps the noun forms for everywhere the same
 * modes are only being named.
 */
export const ENGAGEMENT_MODES: {
  key: ExpertWillingness;
  title: string;
  description: string;
}[] = [
  {
    key: "playbook_contribution",
    title: "Contribute to the playbook",
    description:
      "Review the AI-generated draft and strengthen it with your experience, examples and practical advice.",
  },
  {
    key: "advisory_call",
    title: "Take an advisory call",
    description:
      "Speak directly with the client to help them work through the challenge and decide what to do next.",
  },
  {
    key: "consulting_engagement",
    title: "Support the project",
    description:
      "Help the client put the strategy into practice through hands-on consulting and delivery support.",
  },
];

/* -------------------------------------------------------------------- policies */

export const EXPERT_POLICY_VERSION = "2026.1";

export const EXPERT_POLICIES: { id: string; title: string; body: string }[] = [
  {
    id: "confidentiality",
    title: "Confidentiality",
    body: "Anything you see about a client — their brief, executive summary, transcript or playbook — stays inside TailoredIQ. You will not repeat it outside the engagement, including in your own writing or thought leadership.",
  },
  {
    id: "client_privacy",
    title: "Client privacy",
    body: "You only access the client information you have been granted for a specific project, and only for as long as you are engaged on it. You will not attempt to identify a client outside the platform.",
  },
  {
    id: "conflicts",
    title: "Conflicts of interest",
    body: "You will decline an opportunity where you have a competing interest — a directorship, an investment, an employer relationship or ongoing work with a direct competitor — and disclose it rather than working around it.",
  },
  {
    id: "conduct",
    title: "Professional conduct",
    body: "You engage with leaders and other experts respectfully, on time, and in good faith, and you follow through on the contributions you accept.",
  },
  {
    id: "accuracy",
    title: "Accuracy of expertise claims",
    body: "The experience on your profile is real and verifiable. You will not overstate seniority, outcomes or credentials, and you will keep your profile current.",
  },
  {
    id: "competence",
    title: "Staying inside your competence",
    body: "You will not advise outside the areas your experience actually supports. Saying \"this is outside what I've done\" is always an acceptable answer, and preferable to a confident guess.",
  },
  {
    id: "client_information_use",
    title: "Appropriate use of client information",
    body: "Client information is not used to market to them, to benefit another client, or as material for your own commercial work.",
  },
  {
    id: "knowledge_base",
    title: "Responsible contribution",
    body: "Contributions to the knowledge base are your own work, based on real experience, and anonymised where they draw on a real situation. AI-assisted drafting is disclosed.",
  },
];

/* ------------------------------------------------------------------------ quiz */

export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  /** Shown after answering, whether right or wrong. */
  rationale: string;
}

export const QUIZ_PASS_MARK = 5; // out of QUIZ_QUESTIONS.length

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q_confidential",
    prompt:
      "A client's brief describes a restructuring that hasn't been announced internally. A friend at another company asks what you've been working on. What do you do?",
    choices: [
      "Describe the situation without naming the client",
      "Say you're working on a confidential engagement and leave it there",
      "Share it — the client isn't named, so nothing is identifying",
    ],
    correctIndex: 1,
    rationale:
      "Anonymising doesn't make confidential information shareable. A restructuring that hasn't been announced is exactly the kind of detail that can be traced back.",
  },
  {
    id: "q_competence",
    prompt:
      "During an advisory call, the client asks a detailed tax-structuring question. You've worked adjacent to it but never led it. What's the right response?",
    choices: [
      "Give your best answer — they booked you for the hour",
      "Say it's outside what you've directly done, and point them to what you can speak to",
      "Look it up during the call and answer from that",
    ],
    correctIndex: 1,
    rationale:
      "Experts are matched for lived experience. Naming the edge of your competence protects the client's decision and your credibility.",
  },
  {
    id: "q_conflict",
    prompt:
      "You're offered an opportunity from a company that directly competes with a business you hold equity in. What should you do?",
    choices: [
      "Decline and disclose the conflict",
      "Accept, but avoid discussing anything competitive",
      "Accept — an equity holding isn't an employment relationship",
    ],
    correctIndex: 0,
    rationale:
      "A competing financial interest is a conflict regardless of employment. Disclose it rather than trying to manage around it.",
  },
  {
    id: "q_case_study",
    prompt: "You want to write a case study drawn from a TailoredIQ consultation you delivered. What's required?",
    choices: [
      "Nothing — your own contribution is yours to write about",
      "Only that you change the company name",
      "It must not draw on confidential client information, and goes through peer review before publication",
    ],
    correctIndex: 2,
    rationale:
      "Knowledge-base contributions are peer-reviewed before publication, and client confidentiality survives the end of an engagement.",
  },
  {
    id: "q_access",
    prompt: "Which client information are you entitled to see?",
    choices: [
      "Any brief in your expertise area",
      "Only the projects you've been matched to and have accepted",
      "Anything visible in the expert dashboard",
    ],
    correctIndex: 1,
    rationale:
      "Access is per project and per acceptance. Opportunity previews are deliberately limited until you express interest.",
  },
  {
    id: "q_ai",
    prompt: "How should AI-generated content and your own contribution relate on the platform?",
    choices: [
      "They're interchangeable once reviewed",
      "Your contribution is always attributed to you and kept distinct from AI-generated content",
      "AI content should be edited so it reads as your own",
    ],
    correctIndex: 1,
    rationale:
      "The value of the network is human experience. Attribution is what lets a client weigh it — blurring the two destroys that.",
  },
];

/* -------------------------------------------------------------- points & levels */

/**
 * Point values are configuration, not product rules — tune these without
 * touching any calling code. The ledger (expertPointsTransactions) records
 * the value applied at the time, so changing a value never rewrites history.
 */
export const POINT_VALUES: Record<ExpertPointsSource, number> = {
  peer_review: 15,
  insight_published: 40,
  case_study_published: 60,
  expert_conversation: 50,
  playbook_contribution: 35,
  referral_activated: 75,
  client_consultation: 45,
  brief_review: 20,
};

export const POINT_SOURCE_LABELS: Record<ExpertPointsSource, string> = {
  peer_review: "Reviewed another expert's contribution",
  insight_published: "Insight published",
  case_study_published: "Case study published",
  expert_conversation: "Joined an expert conversation",
  playbook_contribution: "Contributed to a playbook",
  referral_activated: "Referred expert approved",
  client_consultation: "Completed a client consultation",
  brief_review: "Reviewed a client recommendation",
};

/**
 * Standing is earned through contribution, not popularity — thresholds are
 * points-based and configurable. Level keys are the existing product's
 * (ExpertLevel), so nothing downstream has to change to re-label them.
 */
export const EXPERT_LEVELS: { key: ExpertLevel; label: string; minPoints: number; blurb: string }[] = [
  { key: "associate", label: "Associate", minPoints: 0, blurb: "Getting started — your first contributions build your standing." },
  { key: "senior", label: "Senior", minPoints: 250, blurb: "Consistently contributing experience the network relies on." },
  { key: "principal", label: "Principal", minPoints: 750, blurb: "A depended-on voice across client work and the knowledge base." },
  { key: "distinguished", label: "Distinguished", minPoints: 1500, blurb: "Among the most relied-upon experience in the network." },
];

export function levelForPoints(points: number): (typeof EXPERT_LEVELS)[number] {
  return [...EXPERT_LEVELS].reverse().find((l) => points >= l.minPoints) ?? EXPERT_LEVELS[0];
}

export function nextLevel(points: number): (typeof EXPERT_LEVELS)[number] | null {
  return EXPERT_LEVELS.find((l) => l.minPoints > points) ?? null;
}

export function levelLabel(key: ExpertLevel): string {
  return EXPERT_LEVELS.find((l) => l.key === key)?.label ?? key;
}

/* ------------------------------------------------------------------ onboarding */

export const ONBOARDING_STEPS: { key: ExpertOnboardingStep; label: string; blurb: string }[] = [
  { key: "background", label: "Professional background", blurb: "Where you've worked and at what level." },
  { key: "evidence", label: "Professional evidence", blurb: "CV, LinkedIn and other proof of experience." },
  { key: "expertise", label: "Areas of expertise", blurb: "Confirm what we identified from your experience." },
  { key: "help_areas", label: "What you can help with", blurb: "The problems you can help leaders solve." },
  { key: "contributions", label: "How you want to contribute", blurb: "The kinds of work you want to be offered." },
  { key: "verification", label: "Verification", blurb: "What we'll check before approving your profile." },
  { key: "policies", label: "Expert policies", blurb: "The commitments every TailoredIQ expert makes." },
  { key: "quiz", label: "Knowledge check", blurb: "A short check on how those policies apply in practice." },
  { key: "availability", label: "Availability", blurb: "How often and how you want to be booked." },
  { key: "preview", label: "Profile preview", blurb: "How clients will see you." },
];

/** Steps that must be complete before a profile can be submitted for review. */
export const REQUIRED_STEPS: ExpertOnboardingStep[] = [
  "background",
  "evidence",
  "expertise",
  "help_areas",
  "contributions",
  "policies",
  "quiz",
  "availability",
];
