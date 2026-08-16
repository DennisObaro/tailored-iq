"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import type { ExpertProfile, Project } from "@/lib/types";
import * as projectsApi from "@/lib/api/projects";
import * as opportunitiesApi from "@/lib/api/opportunities";
import * as expertApi from "@/lib/api/expert-onboarding";
import { useSessionStore } from "@/lib/store/use-session-store";
import { ExpertGate } from "@/components/expert/expert-gate";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { WILLINGNESS_LABELS } from "@/lib/constants/expert";
import { formatRelative } from "@/lib/utils/format";

export default function ExpertProjectsPage() {
  const user = useSessionStore((s) => s.user);
  const [reload, setReload] = useState(0);
  const refetch = () => setReload((n) => n + 1);
  const [profile, setProfile] = useState<ExpertProfile | null | undefined>(undefined);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [listings, setListings] = useState<opportunitiesApi.OpportunityListing[]>([]);
  const [error, setError] = useState(false);

  async function load() {
    if (!user) return;
    try {
      const [p, projectList, opps] = await Promise.all([
        expertApi.getExpertProfile(user.id),
        projectsApi.listProjectsForExpert(user.id),
        opportunitiesApi.listOpportunities(user.id),
      ]);
      setError(false);
      setProfile(p);
      setProjects(projectList);
      setListings(opps);
    } catch {
      setError(true);
      setProfile(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, reload]);

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-50">Your projects</h1>
        <p className="mt-1 text-sm text-gray-400">Client work you&apos;ve accepted and are contributing to.</p>
      </div>

      <ExpertGate profile={profile ?? null} requires="clientDetail">
        {error ? (
          <ErrorState
            whatHappened="We couldn't load your projects."
            dataSafe="Nothing has been lost."
            onRetry={refetch}
          />
        ) : !projects ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No projects yet."
            description="Accept an opportunity and it becomes a project here."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {projects.map((project) => {
              const listing = listings.find((l) => l.opportunity.projectId === project.id);
              return (
                <Link key={project.id} href={`/expert/projects/${project.id}`}>
                  <Card className="flex flex-col gap-2 p-4 transition-colors hover:bg-gray-900">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={listing?.stage ?? project.status} />
                      {project.category && <Badge variant="outline">{project.category}</Badge>}
                      <span className="text-xs text-gray-500">Updated {formatRelative(project.updatedAt)}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-50">{project.title}</p>
                    <p className="line-clamp-2 text-xs text-gray-400">{project.challenge}</p>
                    {listing && listing.opportunity.offeredContributions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {listing.opportunity.offeredContributions.map((c) => (
                          <Badge key={c}>{WILLINGNESS_LABELS[c]}</Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </ExpertGate>
    </div>
  );
}
