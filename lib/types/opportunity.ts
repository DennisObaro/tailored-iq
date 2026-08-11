export type OpportunityResponse = "interested" | "not_for_me" | null;

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
  createdAt: string;
}
