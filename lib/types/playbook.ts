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
  projectId: string;
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
