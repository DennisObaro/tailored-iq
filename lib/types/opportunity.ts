import type { ExpertWillingness } from "./user";

export type OpportunityResponse = "interested" | "not_for_me" | null;

/**
 * The expert's own view of a client engagement (spec §17). Derived from
 * the project's lifecycle plus this expert's response, so it can never
 * disagree with what the client sees.
 */
export type ExpertEngagementStage =
  | "new"
  | "reviewing"
  | "accepted"
  | "contributing"
  | "call_scheduled"
  | "call_completed"
  | "playbook_contribution"
  | "completed"
  | "declined";

export interface Opportunity {
  id: string;
  projectId: string;
  expertId: string;
  title: string;
  summary: string;
  relevanceReason: string;
  category: string;
  requestedContributions: (
    | "review"
    | "contribute_insight"
    | "advisory_call"
    | "playbook_contribution"
    | "longer_engagement"
  )[];
  response: OpportunityResponse;
  /** What the expert actually agreed to do — set when they express interest. */
  offeredContributions: ExpertWillingness[];
  /** Set the first time the expert opens the opportunity, so "new" means new. */
  viewedAt?: string;
  respondedAt?: string;
  createdAt: string;
}
