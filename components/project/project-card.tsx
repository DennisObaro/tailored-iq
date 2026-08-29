import Link from "next/link";
import type { Project } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { StatusBadge, statusTone, type Tone } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/**
 * One verb per bucket rather than a one-off string per status: what the
 * button says is a direct read of the same tone the badge shows, so the two
 * can't say different things about what a card wants from the client.
 * "Open" is the fallback for the two tones a challenge never actually
 * carries (warning, danger) as much as for neutral/progress themselves.
 */
const ACTION_LABEL_BY_TONE: Partial<Record<Tone, string>> = {
  action: "Continue",
  success: "Review",
};

function nextActionLabel(tone: Tone): string {
  return ACTION_LABEL_BY_TONE[tone] ?? "Open";
}

export function ProjectCard({ project }: { project: Project }) {
  const tone = statusTone(project.status);
  const needsAction = tone === "action";

  return (
    <Link href={`/projects/${project.id}`} className="block h-full">
      <Card
        className={cn(
          "flex h-full flex-col gap-2.5 border-gray-900 p-4 transition-colors hover:bg-gray-900",
          // The same signal as the badge, restated as weight rather than
          // colour alone — a card asking for you shouldn't only be visible
          // if you happen to read the pill text.
          needsAction && "border-l-2 border-l-info",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
          <p className="line-clamp-2 text-sm font-medium text-gray-50">{project.title}</p>
          <StatusBadge status={project.status} className="shrink-0" />
        </div>
        <p className="line-clamp-2 text-xs text-gray-400">{project.challenge}</p>
        <div className="flex flex-wrap items-center gap-2">
          {project.category && <Badge variant="outline">{project.category}</Badge>}
          {/* Pushed clear of the tag and visibly quieter than it — the tag is
              what a scanning eye should land on first. */}
          <span className="ml-auto shrink-0 text-[11px] text-gray-600">
            Updated {formatRelative(project.updatedAt)}
          </span>
        </div>
        <span className="mt-auto inline-flex h-8 w-fit items-center justify-center rounded-[10px] border border-gray-800 px-3 text-xs font-medium text-gray-50">
          {nextActionLabel(tone)}
        </span>
      </Card>
    </Link>
  );
}
