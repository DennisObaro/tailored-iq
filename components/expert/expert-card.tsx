import Link from "next/link";
import { Star } from "lucide-react";
import type { ExpertListing } from "@/lib/api/experts";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function ExpertCard({ listing, projectId }: { listing: ExpertListing; projectId?: string }) {
  const { user, profile } = listing;
  const href = projectId ? `/experts/${user.id}?projectId=${projectId}` : `/experts/${user.id}`;
  return (
    <Link href={href}>
      <Card className="flex flex-col gap-3 p-4 transition-colors hover:bg-gray-850">
        <div className="flex items-start gap-3">
          <Avatar firstName={user.firstName} lastName={user.lastName} src={user.avatarUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-50">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-gray-400">{profile.currentRole}</p>
            <div className="mt-1 flex items-center gap-1 text-xs text-primary-400">
              <Star className="size-3 fill-current" aria-hidden />
              {profile.rating.toFixed(1)}
              <span className="text-gray-500">({profile.reviewCount})</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400">{profile.yearsExperience} years of operating experience</p>
        <div className="flex flex-wrap gap-1.5">
          {profile.expertiseTags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </Card>
    </Link>
  );
}
