"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import * as projectsApi from "@/lib/api/projects";
import { useSessionStore } from "@/lib/store/use-session-store";
import { Skeleton } from "@/components/ui/skeleton";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const MAX_RECENTS = 8;

export function RecentChats() {
  const pathname = usePathname();
  const user = useSessionStore((s) => s.user);
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    if (!user) return;
    projectsApi.listProjects(user.id).then(setProjects);
  }, [user, pathname]);

  if (!user) return null;

  return (
    <div className="mt-9 flex flex-col gap-0.5">
      <span className="px-2.5 py-1 text-xs font-medium text-gray-500">Recents</span>

      {projects === null ? (
        <div className="flex flex-col gap-2 px-2.5 py-1">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
          <Skeleton className="h-3.5 w-4/6" />
        </div>
      ) : projects.length === 0 ? (
        <span className="px-2.5 py-1 text-xs text-gray-600">No chats yet</span>
      ) : (
        projects.slice(0, MAX_RECENTS).map((project) => {
          const href = `/chat/${project.id}`;
          const active = pathname === href;
          return (
            <Link
              key={project.id}
              href={href}
              title={project.title}
              className={cn(
                "truncate rounded-md px-2.5 py-1.5 text-sm transition-colors",
                active ? "bg-gray-900 text-gray-50" : "text-gray-400 hover:bg-gray-900 hover:text-gray-100",
              )}
            >
              {project.title}
            </Link>
          );
        })
      )}
    </div>
  );
}
