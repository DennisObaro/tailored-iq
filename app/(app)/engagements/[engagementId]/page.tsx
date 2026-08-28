"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import * as engagementsApi from "@/lib/api/engagements";
import type { EngagementDetail } from "@/lib/api/engagements";
import { EngagementHeader } from "@/components/engagement/engagement-header";
import { EngagementScheduleLog } from "@/components/engagement/engagement-schedule-log";
import { EngagementFiles } from "@/components/engagement/engagement-files";
import { ThreadPanel } from "@/components/conversation/thread-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useSessionStore } from "@/lib/store/use-session-store";

export default function EngagementWorkspacePage() {
  const { engagementId } = useParams<{ engagementId: string }>();
  const user = useSessionStore((s) => s.user);
  const [detail, setDetail] = useState<EngagementDetail | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    engagementsApi.getEngagement(engagementId, user.id).then(setDetail);
  }, [engagementId, user]);

  if (detail === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <ErrorState whatHappened="We couldn't find this project." dataSafe="Nothing has been lost." />
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-col">
      <EngagementHeader detail={detail} onChange={(engagement) => setDetail({ ...detail, engagement })} />
      <div className="flex min-h-0 flex-1">
        <ThreadPanel conversationId={detail.engagement.conversationId} className="min-h-0 flex-1" />
        <aside className="hidden w-80 shrink-0 flex-col gap-5 overflow-y-auto border-l border-gray-800 p-5 lg:flex">
          <EngagementScheduleLog
            engagementId={detail.engagement.id}
            clientId={detail.engagement.clientId}
            expertId={detail.engagement.expertId}
          />
          <EngagementFiles engagementId={detail.engagement.id} viewerId={user!.id} />
        </aside>
      </div>
    </div>
  );
}
