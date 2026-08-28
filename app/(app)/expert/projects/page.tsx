"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ClipboardList, HandHeart } from "@/components/icons";
import type { ExpertProfile, Project } from "@/lib/types";
import * as projectsApi from "@/lib/api/projects";
import * as opportunitiesApi from "@/lib/api/opportunities";
import * as expertApi from "@/lib/api/expert-onboarding";
import * as engagementsApi from "@/lib/api/engagements";
import { useSessionStore } from "@/lib/store/use-session-store";
import { ExpertGate } from "@/components/expert/expert-gate";
import { EngagementCard } from "@/components/engagement/engagement-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { WILLINGNESS_LABELS } from "@/lib/constants/expert";
import { formatRelative } from "@/lib/utils/format";
import { ENGAGEMENT_BUCKETS, engagementBucketOf } from "@/lib/utils/engagement";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { key: "contributions", label: "Playbook contributions" },
  { key: "implementation", label: "Implementation" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function ExpertProjectsHub() {
  const searchParams = useSearchParams();
  const user = useSessionStore((s) => s.user);
  const [reload, setReload] = useState(0);
  const refetch = () => setReload((n) => n + 1);

  const initialTab = (searchParams.get("tab") as TabKey | null) ?? "contributions";
  const [tab, setTab] = useState<TabKey>(TABS.some((t) => t.key === initialTab) ? initialTab : "contributions");

  const [profile, setProfile] = useState<ExpertProfile | null | undefined>(undefined);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [listings, setListings] = useState<opportunitiesApi.OpportunityListing[]>([]);
  const [engagements, setEngagements] = useState<engagementsApi.EngagementListing[] | null>(null);
  const [error, setError] = useState(false);

  async function load() {
    if (!user) return;
    try {
      const [p, projectList, opps, engagementList] = await Promise.all([
        expertApi.getExpertProfile(user.id),
        projectsApi.listProjectsForExpert(user.id),
        opportunitiesApi.listOpportunities(user.id),
        engagementsApi.listEngagementsForExpert(user.id),
      ]);
      setError(false);
      setProfile(p);
      setProjects(projectList);
      setListings(opps);
      setEngagements(engagementList);
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

  const counts: Record<TabKey, number> = {
    contributions: projects?.length ?? 0,
    implementation: engagements?.length ?? 0,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-50">Your projects</h1>
        <p className="mt-1 text-sm text-gray-400">Client work you&apos;ve accepted and are contributing to.</p>
      </div>

      <ExpertGate profile={profile ?? null} requires="clientDetail">
        <div className="flex gap-1 border-b border-gray-800">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-current={tab === t.key ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
                tab === t.key ? "border-primary-500 text-gray-50" : "border-transparent text-gray-500 hover:text-gray-300",
              )}
            >
              {t.label} {counts[t.key] > 0 && <span className="text-xs text-gray-500">({counts[t.key]})</span>}
            </button>
          ))}
        </div>

        {error ? (
          <ErrorState
            whatHappened="We couldn't load your projects."
            dataSafe="Nothing has been lost."
            onRetry={refetch}
          />
        ) : tab === "contributions" ? (
          !projects ? (
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
          )
        ) : !engagements ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : engagements.length === 0 ? (
          <EmptyState
            icon={HandHeart}
            title="No implementation work yet."
            description="When a client books you for Support with Implementation on a playbook, it shows up here."
          />
        ) : (
          <div className="space-y-8">
            {ENGAGEMENT_BUCKETS.map(([key, label]) => {
              const items = engagements.filter((l) => engagementBucketOf(l) === key);
              if (items.length === 0) return null;
              return (
                <div key={key}>
                  <h2 className="mb-3 text-sm font-medium text-gray-300">{label}</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {items.map((listing) => (
                      <EngagementCard key={listing.engagement.id} listing={listing} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ExpertGate>
    </div>
  );
}

export default function ExpertProjectsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl p-6"><Skeleton className="h-40 w-full" /></div>}>
      <ExpertProjectsHub />
    </Suspense>
  );
}
