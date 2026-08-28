"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import type { Engagement } from "@/lib/types";
import type { EngagementDetail } from "@/lib/api/engagements";
import * as engagementsApi from "@/lib/api/engagements";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRelative } from "@/lib/utils/format";

export function EngagementHeader({
  detail,
  onChange,
}: {
  detail: EngagementDetail;
  onChange: (engagement: Engagement) => void;
}) {
  const [busy, setBusy] = useState(false);
  const { engagement, counterpart, playbook, viewerRole } = detail;
  const viewerId = viewerRole === "client" ? engagement.clientId : engagement.expertId;

  async function propose() {
    setBusy(true);
    try {
      onChange(await engagementsApi.proposeCompletion(engagement.id, viewerId));
    } finally {
      setBusy(false);
    }
  }
  async function confirm() {
    setBusy(true);
    try {
      onChange(await engagementsApi.confirmCompletion(engagement.id, viewerId));
    } finally {
      setBusy(false);
    }
  }
  async function retract() {
    setBusy(true);
    try {
      onChange(await engagementsApi.retractCompletionProposal(engagement.id, viewerId));
    } finally {
      setBusy(false);
    }
  }

  const iProposed = engagement.status === "pending_completion" && engagement.completionProposedBy === viewerRole;

  return (
    <header className="shrink-0 border-b border-gray-800 px-6 py-4">
      <div className="mx-auto mb-3 max-w-3xl">
        <Link
          href="/engagements"
          className="-ml-1 inline-flex items-center gap-0.5 rounded-md py-0.5 pl-1 pr-2 text-xs text-gray-500 hover:text-gray-300"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          Projects
        </Link>
      </div>
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-start gap-3">
          <Avatar firstName={counterpart.firstName} lastName={counterpart.lastName} src={counterpart.avatarUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-50">
              {counterpart.firstName} {counterpart.lastName}
            </p>
            <Link
              href={`/playbooks/${playbook.id}`}
              className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-300"
            >
              {playbook.title}
              <ChevronRight className="size-3" aria-hidden />
            </Link>
            <p className="mt-0.5 text-xs text-gray-500">Started {formatRelative(engagement.createdAt)}</p>
          </div>
          <StatusBadge status={engagement.status} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {engagement.status === "in_progress" && (
            <Button size="sm" variant="outline" loading={busy} onClick={propose}>
              Mark as complete
            </Button>
          )}
          {engagement.status === "pending_completion" && iProposed && (
            <>
              <p className="text-xs text-gray-400">Waiting for {counterpart.firstName} to confirm.</p>
              <Button size="sm" variant="ghost" loading={busy} onClick={retract}>
                Retract
              </Button>
            </>
          )}
          {engagement.status === "pending_completion" && !iProposed && (
            <>
              <Button size="sm" loading={busy} onClick={confirm}>
                Confirm completion
              </Button>
              <Button size="sm" variant="ghost" loading={busy} onClick={retract}>
                Not yet — keep going
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
