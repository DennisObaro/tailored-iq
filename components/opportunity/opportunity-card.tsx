import Link from "next/link";
import type { OpportunityListing } from "@/lib/api/opportunities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { WILLINGNESS_LABELS } from "@/lib/constants/expert";
import { formatRelative } from "@/lib/utils/format";

export function OpportunityCard({ listing }: { listing: OpportunityListing }) {
  const { opportunity, stage } = listing;

  return (
    <Link href={`/expert/opportunities/${opportunity.id}`}>
      <Card className="flex flex-col gap-2 p-4 transition-colors hover:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray-50">{opportunity.title}</p>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline">{opportunity.category}</Badge>
            <StatusBadge status={stage} />
          </div>
        </div>
        <p className="line-clamp-2 text-xs text-gray-400">{opportunity.summary}</p>
        <p className="text-xs text-gold">{opportunity.relevanceReason}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {opportunity.requestedContributions.map((c) => (
            <Badge key={c}>{WILLINGNESS_LABELS[c] ?? c}</Badge>
          ))}
          <span className="text-xs text-gray-500">{formatRelative(opportunity.createdAt)}</span>
        </div>
      </Card>
    </Link>
  );
}
