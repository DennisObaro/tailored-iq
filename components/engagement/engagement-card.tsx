import Link from "next/link";
import type { EngagementListing } from "@/lib/api/engagements";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRelative } from "@/lib/utils/format";

export function EngagementCard({ listing }: { listing: EngagementListing }) {
  const { engagement, counterpart, playbookTitle } = listing;
  return (
    <Link href={`/engagements/${engagement.id}`} className="block">
      <Card className="flex flex-col gap-3 p-4 transition-colors hover:bg-gray-900">
        <div className="flex items-center gap-3">
          <Avatar firstName={counterpart.firstName} lastName={counterpart.lastName} src={counterpart.avatarUrl} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-50">
              {counterpart.firstName} {counterpart.lastName}
            </p>
            <p className="truncate text-xs text-gray-400">{playbookTitle}</p>
          </div>
          <StatusBadge status={engagement.status} />
        </div>
        <p className="text-xs text-gray-500">Updated {formatRelative(engagement.updatedAt)}</p>
      </Card>
    </Link>
  );
}
