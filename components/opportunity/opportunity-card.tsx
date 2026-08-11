import Link from "next/link";
import type { Opportunity } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CONTRIBUTION_LABELS: Record<string, string> = {
  review: "Review",
  contribute_insight: "Contribute insight",
  advisory_call: "Advisory call",
  playbook_contribution: "Playbook contribution",
  longer_engagement: "Longer engagement",
};

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <Link href={`/expert/opportunities/${opportunity.id}`}>
      <Card className="flex flex-col gap-2 p-4 transition-colors hover:bg-gray-850">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray-50">{opportunity.title}</p>
          <Badge variant="outline">{opportunity.category}</Badge>
        </div>
        <p className="text-xs text-gray-400">{opportunity.summary}</p>
        <p className="text-xs text-primary-400">{opportunity.relevanceReason}</p>
        <div className="flex flex-wrap gap-1.5">
          {opportunity.requestedContributions.map((c) => (
            <Badge key={c}>{CONTRIBUTION_LABELS[c] ?? c}</Badge>
          ))}
        </div>
        {opportunity.response && (
          <Badge variant={opportunity.response === "interested" ? "success" : "default"} className="self-start">
            {opportunity.response === "interested" ? "Interested" : "Not for me"}
          </Badge>
        )}
      </Card>
    </Link>
  );
}
