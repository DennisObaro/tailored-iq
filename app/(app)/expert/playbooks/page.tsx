"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, BookOpen } from "@/components/icons";
import type { WorkspaceSummary } from "@/lib/api/playbook-workspace";
import * as workspaceApi from "@/lib/api/playbook-workspace";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useSessionStore } from "@/lib/store/use-session-store";
import { formatRelative } from "@/lib/utils/format";

export default function ExpertPlaybooksPage() {
  const user = useSessionStore((s) => s.user);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[] | null>(null);

  useEffect(() => {
    if (!user) return;
    workspaceApi.listWorkspacesForExpert(user.id).then(setWorkspaces);
  }, [user]);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold text-gray-50">Playbooks</h1>
      <p className="mt-1 text-sm text-gray-400">
        Playbooks you&apos;re collaborating on. TailoredIQ writes the first draft; experts make it worth
        reading.
      </p>

      <div className="mt-6">
        {!workspaces ? (
          <Skeleton className="h-32 w-full" />
        ) : workspaces.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="You're not on a playbook yet."
            description="Accept a brief, then contribute to its playbook from the project — that's what seats you here."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {workspaces.map(({ document, role, awaitingReview }) => (
              <Link key={document.id} href={`/expert/playbooks/${document.id}`}>
                <Card className="flex flex-col gap-2 p-4 transition-colors hover:bg-gray-900">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-gray-50">{document.title}</p>
                    <StatusBadge status={document.status} variant="bare" />
                  </div>
                  <p className="line-clamp-2 text-xs text-gray-400">{document.challenge}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    {role === "scribe" && (
                      <span className="flex items-center gap-1 text-gray-300">
                        <Award className="size-3.5 text-gold" aria-hidden />
                        You hold the crown
                      </span>
                    )}
                    {role === "scribe" && awaitingReview > 0 && (
                      <span className="text-gold">{awaitingReview} awaiting your review</span>
                    )}
                    <span>Updated {formatRelative(document.updatedAt)}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
