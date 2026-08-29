"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FolderKanban } from "@/components/icons";
import type { Project } from "@/lib/types";
import * as projectsApi from "@/lib/api/projects";
import { useSessionStore } from "@/lib/store/use-session-store";
import { ProjectCard } from "@/components/project/project-card";
import { statusTone, type Tone } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type StatusFilter = "all" | Tone;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "action", label: "Needs your input" },
  { value: "progress", label: "In progress" },
  { value: "neutral", label: "Waiting on us" },
  { value: "success", label: "Completed" },
];

type SortOption = "updated" | "attention";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "updated", label: "Recently updated" },
  { value: "attention", label: "Needs attention first" },
];

export default function ProjectsPage() {
  const user = useSessionStore((s) => s.user);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sort, setSort] = useState<SortOption>("updated");

  useEffect(() => {
    if (!user) return;
    projectsApi.listProjects(user.id).then(setProjects);
  }, [user]);

  /** Only the categories actually in play — an empty option is a dead end. */
  const categories = useMemo(() => {
    if (!projects) return [];
    return Array.from(new Set(projects.map((p) => p.category).filter((c): c is string => !!c))).sort();
  }, [projects]);

  const visible = useMemo(() => {
    if (!projects) return [];
    const filtered = projects.filter((p) => {
      if (statusFilter !== "all" && statusTone(p.status) !== statusFilter) return false;
      if (categoryFilter && p.category !== categoryFilter) return false;
      return true;
    });
    if (sort === "updated") {
      return [...filtered].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    }
    // "Needs attention first": action-tone cards lead, each group still
    // reads newest-first — the same order the default gives you, just
    // re-headed by what's actually waiting on you.
    return [...filtered].sort((a, b) => {
      const aNeeds = statusTone(a.status) === "action";
      const bNeeds = statusTone(b.status) === "action";
      if (aNeeds !== bNeeds) return aNeeds ? -1 : 1;
      return a.updatedAt < b.updatedAt ? 1 : -1;
    });
  }, [projects, statusFilter, categoryFilter, sort]);

  const hasFilter = statusFilter !== "all" || !!categoryFilter;

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
        <>
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full sm:w-44"
              aria-label="Filter by status"
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
            {categories.length > 0 && (
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-44"
                aria-label="Filter by category"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            )}
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="w-full sm:ml-auto sm:w-52"
              aria-label="Sort challenges"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No challenges match that filter."
              description="Try a different status or category."
            />
          ) : (
            <div className="grid items-stretch gap-3 sm:grid-cols-2">
              {visible.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
          {hasFilter && visible.length > 0 && (
            <p className="mt-3 text-xs text-gray-500">
              Showing {visible.length} of {projects.length}.
            </p>
          )}
        </>
      )}
    </div>
  );
}
