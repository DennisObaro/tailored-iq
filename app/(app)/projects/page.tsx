"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderKanban } from "@/components/icons";
import type { Project } from "@/lib/types";
import * as projectsApi from "@/lib/api/projects";
import { useSessionStore } from "@/lib/store/use-session-store";
import { ProjectCard } from "@/components/project/project-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsPage() {
  const user = useSessionStore((s) => s.user);
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    if (!user) return;
    projectsApi.listProjects(user.id).then(setProjects);
  }, [user]);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-50">Challenges</h1>
        <Button asChild size="sm">
          <Link href="/chat">Start a challenge</Link>
        </Button>
      </div>

      {!projects ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No challenges yet."
          description="Bring us a business problem and we'll help you work through it."
          action={
            <Button asChild size="sm">
              <Link href="/chat">Start a challenge</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
