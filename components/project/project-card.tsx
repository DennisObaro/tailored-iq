import Link from "next/link";
import type { Project } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/utils/format";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="flex flex-col gap-2.5 p-4 transition-colors hover:bg-gray-850">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-50">{project.title}</p>
          <StatusBadge status={project.status} />
        </div>
        <p className="line-clamp-2 text-xs text-gray-400">{project.challenge}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {project.category && <Badge variant="outline">{project.category}</Badge>}
          <span>Updated {formatRelative(project.updatedAt)}</span>
        </div>
      </Card>
    </Link>
  );
}
