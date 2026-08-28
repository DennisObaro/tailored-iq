"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Calendar, ChevronRight, Video } from "@/components/icons";
import type { ConversationThread } from "@/lib/api/expert-conversations";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { ThreadPanel } from "@/components/conversation/thread-panel";
import { formatCallWhen } from "@/lib/utils/format";

export default function ConversationThreadPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [thread, setThread] = useState<ConversationThread | null>(null);

  const isClient = thread?.viewerRole === "client";
  const { counterpart, counterpartProfile, project, consultation } = thread ?? {};

  const justBooked =
    isClient &&
    consultation?.status === "scheduled" &&
    !thread?.messages.some((m) => m.senderRole === "client" && m.createdAt > consultation.createdAt);

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-gray-800 px-6 py-4">
        {counterpart && (
          <div className="mx-auto flex max-w-3xl flex-wrap items-start gap-3">
            <Avatar
              firstName={counterpart.firstName}
              lastName={counterpart.lastName}
              src={counterpart.avatarUrl}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-50">
                {counterpart.firstName} {counterpart.lastName}
              </p>
              <p className="truncate text-xs text-gray-400">
                {isClient ? counterpartProfile?.currentRole : "Client"}
              </p>
              {isClient && counterpartProfile && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {counterpartProfile.expertiseTags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <StatusBadge status={thread!.stage} />
          </div>
        )}
      </header>

      <ThreadPanel
        conversationId={conversationId}
        onThreadLoaded={setThread}
        suppressEmptyState={Boolean(justBooked)}
        loadingFallback={
          <div className="mx-auto max-w-3xl space-y-4 p-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
        notFoundFallback={
          <div className="mx-auto max-w-3xl p-6">
            <ErrorState whatHappened="We couldn't find this conversation." dataSafe="Nothing has been lost." />
          </div>
        }
        beforeMessages={
          project && (
            <>
              <Card className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {isClient ? "Your challenge" : "The client's challenge"}
                </p>
                <p className="mt-1.5 text-sm font-medium text-gray-100">{project.title}</p>
                <p className="mt-1 line-clamp-3 text-sm text-gray-400">{project.challenge}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {project.category && <Badge variant="outline">{project.category}</Badge>}
                  <StatusBadge status={project.status} />
                  <Button asChild size="sm" variant="ghost" className="ml-auto gap-1">
                    <Link href={isClient ? `/projects/${project.id}` : `/expert/projects/${project.id}`}>
                      View challenge
                      <ChevronRight className="size-3.5" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </Card>

              {consultation && consultation.status !== "cancelled" && (
                <Card className="flex flex-wrap items-center justify-between gap-3 border-primary-500/30 bg-primary-500/5 p-4">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                    <div>
                      <p className="text-sm font-medium text-gray-100">
                        {consultation.status === "completed" ? "Consultation completed" : "Upcoming consultation"}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">{formatCallWhen(consultation.scheduledFor)}</p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <Link href={`/consultations/${consultation.id}`}>
                      <Video className="size-4" aria-hidden />
                      {consultation.status === "completed" ? "View summary" : "Join call"}
                    </Link>
                  </Button>
                </Card>
              )}

              {justBooked && (
                <Card className="border-primary-500/30 bg-primary-500/5 p-4">
                  <p className="text-sm font-medium text-gray-100">
                    Your call with {counterpart?.firstName} is booked.
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    Share anything useful before you speak — context, documents, what you most want to get out of
                    it. {counterpart?.firstName} can read it beforehand.
                  </p>
                </Card>
              )}
            </>
          )
        }
      />
    </div>
  );
}
