export type PlaybookStatus =
  | "draft"
  | "in_progress"
  | "expert_review"
  | "generating"
  | "ready"
  | "updated"
  | "archived";

export interface PlaybookActionItem {
  id: string;
  title: string;
  description: string;
  owner: "client" | "expert";
  timeframe: string;
  status: "not_started" | "in_progress" | "done";
}

export interface PlaybookSection {
  heading: string;
  body: string;
}

export interface Playbook {
  id: string;
  /** Absent for playbooks unlocked from the Explore catalog, which aren't tied to a project. */
  projectId?: string;
  title: string;
  status: PlaybookStatus;
  version: number;
  executiveSummary: string;
  keyInsights: string[];
  recommendedStrategy: string;
  actionItems: PlaybookActionItem[];
  frameworks: string[];
  risks: string[];
  successMeasures: string[];
  resources: string[];
  sections: PlaybookSection[];
  expertContributionIds: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * A pre-written playbook available in Explore. Only the marketing-facing
 * fields are exposed through this type — the real content lives server-side
 * (lib/mock-data/fixtures/playbook-catalog.fixture.ts) and only becomes a
 * real Playbook record once a user unlocks it, so there's nothing to leak
 * through a locked card or a direct URL.
 */
export interface PlaybookTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  whatsIncluded: string[];
}

export interface ExpertContribution {
  id: string;
  expertId: string;
  projectId: string;
  playbookId?: string;
  type: "insight" | "review" | "playbook_input";
  content: string;
  status: "draft" | "submitted" | "under_review" | "approved" | "published";
  createdAt: string;
}
