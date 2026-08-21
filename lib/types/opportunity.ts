import type { ExpertWillingness } from "./user";

export type OpportunityResponse = "interested" | "not_for_me" | null;

/**
 * What kind of engagement this opportunity is.
 *
 * `standard_brief` is the normal case: a client diagnosed their challenge
 * through the chat, and the expert chooses how they'd like to contribute.
 *
 * `direct_intake` is the client who skipped that — they booked an expert
 * before there was a brief to book against. There is nothing to opt into
 * (they picked this expert directly); the work is running the conversation
 * and completing the official brief on the client's behalf.
 */
export type OpportunityKind = "standard_brief" | "direct_intake";

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
  | "declined"
  /** Direct intake: the brief still has to be built with the client. */
  | "intake_pending"
  | "intake_submitted";

export interface Opportunity {
  id: string;
  projectId: string;
  expertId: string;
  kind: OpportunityKind;
  title: string;
  summary: string;
  relevanceReason: string;
  category: string;
  /**
   * What the client asked for. Same vocabulary as what the expert can offer
   * back — these used to be two separate unions whose last members didn't
   * match (`longer_engagement` vs `consulting_engagement`), so a request for
   * hands-on support could never line up with an expert willing to give it.
   * Empty for a direct intake, where there is nothing to choose between.
   */
  requestedContributions: ExpertWillingness[];
  response: OpportunityResponse;
  /** What the expert actually agreed to do — set when they express interest. */
  offeredContributions: ExpertWillingness[];
  /**
   * Direct intake only: what the client said to each prepared question,
   * index-aligned to DIAGNOSTIC_QUESTIONS. Held here rather than written
   * straight into the conversation because the expert saves as they go, and
   * a half-filled conversation would make the brief generator — which reads
   * answers positionally — assemble the wrong fields.
   */
  intakeAnswers?: string[];
  /** Set the first time the expert opens the opportunity, so "new" means new. */
  viewedAt?: string;
  respondedAt?: string;
  createdAt: string;
}
