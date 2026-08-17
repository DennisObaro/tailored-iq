import Link from "next/link";
import { StarFilled } from "@/components/icons";
import type { ExpertListing } from "@/lib/api/experts";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

export function ExpertCard({
  listing,
  projectId,
  reason,
  truncateReason = false,
}: {
  listing: ExpertListing;
  projectId?: string;
  reason?: string;
  /** Clamps the reason chip to one line and stretches it full-width instead of hugging the text. */
  truncateReason?: boolean;
}) {
  const { user, profile } = listing;
  const params = new URLSearchParams();
  if (projectId) params.set("projectId", projectId);
  if (reason) params.set("reason", reason);
  const query = params.toString();
  const href = `/experts/${user.id}${query ? `?${query}` : ""}`;

  return (
    <Link href={href} className="block h-full">
      <Card className="flex h-full flex-col gap-3 border-gray-900 p-4 transition-colors hover:bg-gray-900">
        {reason && (
          <Badge
            variant="primary"
            className={cn("rounded-lg", truncateReason ? "w-full truncate" : "w-fit")}
          >
            {reason}
          </Badge>
        )}
        <div className="flex items-start gap-3">
          <Avatar
            firstName={user.firstName}
            lastName={user.lastName}
            src={user.avatarUrl}
            size="lg"
            online={profile.isOnline}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-50">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-gray-400">{profile.currentRole}</p>
          </div>
        </div>
        <p className="text-xs font-medium text-gray-300">{profile.yearsExperience} years of operating experience</p>
        <div className="flex flex-wrap gap-1.5">
          {profile.expertiseTags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            {profile.reviewCount > 0 ? (
              <>
                <StarFilled className="size-3" aria-hidden />
                {profile.rating.toFixed(1)}
                <span>({profile.reviewCount})</span>
              </>
            ) : (
              "New · no reviews yet"
            )}
          </span>
          <span className="inline-flex h-8 items-center justify-center rounded-[10px] border border-gray-800 px-3 text-xs font-medium text-gray-50">
            View profile
          </span>
        </div>
      </Card>
    </Link>
  );
}
