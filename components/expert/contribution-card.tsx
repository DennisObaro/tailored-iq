import Link from "next/link";
import type { ExpertContribution, User } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { CONTRIBUTION_TYPE_LABELS } from "@/lib/constants/expert";
import { formatRelative } from "@/lib/utils/format";

export function ContributionCard({
  contribution,
  author,
  href,
}: {
  contribution: ExpertContribution;
  author?: User;
  href?: string;
}) {
  const body = (
    <Card className="flex flex-col gap-2 p-4 transition-colors hover:bg-gray-900">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{CONTRIBUTION_TYPE_LABELS[contribution.type]}</Badge>
        <StatusBadge status={contribution.status} />
        {contribution.incorporated && <Badge variant="success">In the playbook</Badge>}
      </div>
      <p className="text-sm font-medium text-gray-50">{contribution.title}</p>
      <p className="line-clamp-2 text-xs text-gray-400">{contribution.content}</p>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {author && (
          <span className="flex items-center gap-1.5">
            <Avatar firstName={author.firstName} lastName={author.lastName} src={author.avatarUrl} size="sm" />
            {author.firstName} {author.lastName}
          </span>
        )}
        <span>{formatRelative(contribution.updatedAt)}</span>
        {contribution.pointsAwarded > 0 && <span className="text-gold">+{contribution.pointsAwarded} pts</span>}
      </div>
    </Card>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}
