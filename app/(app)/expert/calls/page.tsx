"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Video } from "@/components/icons";
import type { Consultation, ExpertProfile, Project } from "@/lib/types";
import * as consultationsApi from "@/lib/api/consultations";
import * as projectsApi from "@/lib/api/projects";
import * as expertApi from "@/lib/api/expert-onboarding";
import { useSessionStore } from "@/lib/store/use-session-store";
import { ExpertGate } from "@/components/expert/expert-gate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCallWhen, formatDuration } from "@/lib/utils/format";

export default function ExpertCallsPage() {
  const user = useSessionStore((s) => s.user);
  const [profile, setProfile] = useState<ExpertProfile | null | undefined>(undefined);
  const [calls, setCalls] = useState<Consultation[] | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [p, callList, projectList] = await Promise.all([
        expertApi.getExpertProfile(user.id),
        consultationsApi.listConsultationsForExpert(user.id),
        projectsApi.listProjectsForExpert(user.id),
      ]);
      if (cancelled) return;
      setProfile(p);
      setCalls(callList);
      setProjects(projectList);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const upcoming = (calls ?? []).filter((c) => c.status === "scheduled" || c.status === "in_call");
  const past = (calls ?? []).filter((c) => c.status === "completed" || c.status === "cancelled");

  function titleFor(call: Consultation) {
    return projects.find((p) => p.id === call.projectId)?.title ?? "Client consultation";
  }

  function CallRow({ call }: { call: Consultation }) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={call.status} />
            <span className="text-xs text-gray-500">{formatCallWhen(call.scheduledFor)}</span>
            {call.durationSeconds && (
              <span className="text-xs text-gray-500">· {formatDuration(call.durationSeconds)}</span>
            )}
          </div>
          <p className="mt-1.5 truncate text-sm text-gray-100">{titleFor(call)}</p>
          {call.expertFollowUp && (
            <p className="mt-0.5 text-xs text-gold">You offered further support after this call.</p>
          )}
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <Link href={`/consultations/${call.id}`}>
            {call.status === "completed" ? "View summary" : "Open call room"}
          </Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-50">Calls</h1>
        <p className="mt-1 text-sm text-gray-400">Advisory calls with leaders, and what came out of them.</p>
      </div>

      <ExpertGate profile={profile ?? null} requires="calls">
        {!calls ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : calls.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No calls yet."
            description="When a client books time with you, it appears here."
          />
        ) : (
          <>
            <section>
              <h2 className="mb-3 text-sm font-medium text-gray-300">Upcoming</h2>
              {upcoming.length === 0 ? (
                <Card className="p-4">
                  <p className="text-sm text-gray-400">Nothing scheduled.</p>
                </Card>
              ) : (
                <div className="flex flex-col gap-2">
                  {upcoming.map((c) => (
                    <CallRow key={c.id} call={c} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-sm font-medium text-gray-300">Past</h2>
              {past.length === 0 ? (
                <Card className="p-4">
                  <p className="text-sm text-gray-400">No completed calls yet.</p>
                </Card>
              ) : (
                <div className="flex flex-col gap-2">
                  {past.map((c) => (
                    <CallRow key={c.id} call={c} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </ExpertGate>
    </div>
  );
}
