import Link from "next/link";
import type { Project, ProjectStatus } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/utils/format";

const NEXT_ACTION_LABEL: Record<ProjectStatus, string> = {
  draft: "Continue conversation",
  brief_in_progress: "Continue conversation",
  brief_submitted: "Continue",
  analysing: "Continue",
  report_ready: "Read executive summary",
  expert_matching: "View matched experts",
  consultation_scheduled: "View call details",
  consultation_completed: "Get a playbook",
  playbook_in_progress: "View progress",
  expert_review: "Continue",
  playbook_ready: "View action plan",
  completed: "View summary",
  archived: "View",
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="flex flex-col gap-2.5 border-gray-900 p-4 transition-colors hover:bg-gray-900">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-50">{project.title}</p>
          <StatusBadge status={project.status} />
        </div>
        <p className="line-clamp-2 text-xs text-gray-400">{project.challenge}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {project.category && <Badge variant="outline">{project.category}</Badge>}
          <span>Updated {formatRelative(project.updatedAt)}</span>
        </div>
        <span className="mt-0.5 inline-flex h-8 w-fit items-center justify-center rounded-[10px] border border-gray-800 px-3 text-xs font-medium text-gray-50">
          {NEXT_ACTION_LABEL[project.status]}
        </span>
      </Card>
    </Link>
  );
}
