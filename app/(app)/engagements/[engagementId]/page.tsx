"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import * as engagementsApi from "@/lib/api/engagements";
import type { EngagementDetail } from "@/lib/api/engagements";
import { EngagementHeader } from "@/components/engagement/engagement-header";
import { EngagementScheduleLog } from "@/components/engagement/engagement-schedule-log";
import { EngagementFiles } from "@/components/engagement/engagement-files";
import { EngagementRating } from "@/components/engagement/engagement-rating";
import { ThreadPanel } from "@/components/conversation/thread-panel";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useSessionStore } from "@/lib/store/use-session-store";
import { cn } from "@/lib/utils/cn";

export default function EngagementWorkspacePage() {
  const { engagementId } = useParams<{ engagementId: string }>();
  const user = useSessionStore((s) => s.user);
  const [detail, setDetail] = useState<EngagementDetail | null | undefined>(undefined);
  const [filesRefreshKey, setFilesRefreshKey] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);
  const desktopRatingRef = useRef<HTMLDivElement>(null);
  const mobileRatingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    engagementsApi.getEngagement(engagementId, user.id).then(setDetail);
  }, [engagementId, user]);

  useEffect(() => {
    if (!justCompleted) return;
    const target = desktopRatingRef.current?.offsetParent ? desktopRatingRef.current : mobileRatingRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timeout = setTimeout(() => setJustCompleted(false), 2000);
    return () => clearTimeout(timeout);
  }, [justCompleted]);

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

  const scheduleAction = detail.viewerRole === "client" && (
    <Button asChild size="sm" variant="outline" className="gap-1.5">
      <Link href={`/experts/${detail.counterpart.id}/book?playbookId=${detail.playbook.id}`}>
        <Calendar className="size-3.5" aria-hidden />
        Schedule a session
      </Link>
    </Button>
  );

  function handleEngagementChange(engagement: EngagementDetail["engagement"]) {
    const finishedJustNow = engagement.status === "completed" && detail!.engagement.status !== "completed";
    setDetail({ ...detail!, engagement });
    if (finishedJustNow) setJustCompleted(true);
  }

  return (
    <div className="flex h-full min-w-0">
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <EngagementHeader detail={detail} onChange={handleEngagementChange} />
        <ThreadPanel
          conversationId={detail.engagement.conversationId}
          className="min-h-0 flex-1"
          onMessageSent={() => setFilesRefreshKey((k) => k + 1)}
        />
        <div className="flex flex-col gap-5 border-t border-gray-800 p-5 lg:hidden">
          {scheduleAction}
          <EngagementScheduleLog engagementId={detail.engagement.id} viewerId={user!.id} />
          <EngagementFiles
            engagementId={detail.engagement.id}
            viewerId={user!.id}
            refreshKey={filesRefreshKey}
          />
          {detail.engagement.status === "completed" && (
            <div
              ref={mobileRatingRef}
              className={cn("rounded-lg transition-shadow", justCompleted && "ring-2 ring-primary-500")}
            >
              <EngagementRating
                detail={detail}
                onSubmitted={(review) => setDetail({ ...detail, myReview: review })}
              />
            </div>
          )}
        </div>
      </div>
      <aside className="hidden w-80 shrink-0 flex-col gap-5 overflow-y-auto border-l border-gray-800 p-5 lg:flex">
        {scheduleAction}
        <EngagementScheduleLog engagementId={detail.engagement.id} viewerId={user!.id} />
        <EngagementFiles
          engagementId={detail.engagement.id}
          viewerId={user!.id}
          refreshKey={filesRefreshKey}
        />
        {detail.engagement.status === "completed" && (
          <div
            ref={desktopRatingRef}
            className={cn("rounded-lg transition-shadow", justCompleted && "ring-2 ring-primary-500")}
          >
            <EngagementRating
              detail={detail}
              onSubmitted={(review) => setDetail({ ...detail, myReview: review })}
            />
          </div>
        )}
      </aside>
    </div>
  );
}
