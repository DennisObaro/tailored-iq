import Link from "next/link";
import type { OpportunityListing } from "@/lib/api/opportunities";
import { Card } from "@/components/ui/card";
import { formatRelative } from "@/lib/utils/format";

/**
 * "about 1 month ago" reads as prose; in an eyebrow next to a category it's
 * just noise around the number that matters.
 */
function age(iso: string) {
  return formatRelative(iso).replace(/^about /, "");
}

/**
 * One brief, sized by how well it fits.
 *
 * The match figure is the loudest thing on the card because it's what an
 * expert scanning a list actually sorts on — everything else is there to
 * justify it, in the order you'd ask: what field, how fresh, what is it,
 * and why me. The whole card is one link; choosing how to contribute
 * happens on the opportunity itself, with the full brief in view.
 */
export function OpportunityCard({ listing }: { listing: OpportunityListing }) {
  const { opportunity, matchPercent } = listing;

  return (
    <Link href={`/expert/opportunities/${opportunity.id}`} className="block">
      <Card className="flex flex-col gap-3 p-5 transition-colors hover:bg-gray-900">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              {opportunity.category} · {age(opportunity.createdAt)}
            </p>
            <p className="mt-1.5 text-base font-medium leading-snug text-gray-50">{opportunity.title}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-semibold leading-none text-gray-50 tabular-nums">{matchPercent}%</p>
            {/* Named for what it scores. A bare "match" invites the expert to
                read the number as a chance of being picked; this says it's a
                measure of how close the challenge sits to their expertise. */}
            <p className="mt-1 whitespace-nowrap text-[11px] uppercase tracking-wider text-gray-500">
              Expertise match
            </p>
          </div>
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-gray-400">{opportunity.summary}</p>

        <p className="border-t border-gray-800 pt-3 text-xs text-gray-400">{opportunity.relevanceReason}</p>
      </Card>
    </Link>
  );
}
