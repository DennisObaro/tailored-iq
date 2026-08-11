import type { Opportunity, OpportunityResponse } from "@/lib/types";
import { simulateNetwork, ApiError } from "./client";
import { db } from "./_db";

export async function listOpportunities(expertId: string): Promise<Opportunity[]> {
  return simulateNetwork(
    () =>
      db
        .get()
        .opportunities.filter((o) => o.expertId === expertId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    { latency: [150, 300] },
  );
}

export async function getOpportunity(opportunityId: string): Promise<Opportunity | null> {
  return simulateNetwork(() => db.get().opportunities.find((o) => o.id === opportunityId) ?? null, {
    latency: [80, 200],
  });
}

export async function respondToOpportunity(
  opportunityId: string,
  response: OpportunityResponse,
): Promise<Opportunity> {
  return simulateNetwork(() =>
    db.update((d) => {
      const opportunity = d.opportunities.find((o) => o.id === opportunityId);
      if (!opportunity) throw new ApiError("Opportunity not found.", "NOT_FOUND");
      opportunity.response = response;

      if (response === "interested") {
        const project = d.projects.find((p) => p.id === opportunity.projectId);
        if (project && !project.matchedExpertIds.includes(opportunity.expertId)) {
          project.matchedExpertIds.push(opportunity.expertId);
        }
      }
      return opportunity;
    }),
  );
}
