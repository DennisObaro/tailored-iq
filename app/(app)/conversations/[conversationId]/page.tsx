"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight, Video, X } from "@/components/icons";
import type { ConversationThread } from "@/lib/api/expert-conversations";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { ConsultationSummary } from "@/components/consultation/consultation-summary";
import { ThreadPanel } from "@/components/conversation/thread-panel";
import { formatCallWhen } from "@/lib/utils/format";

export default function ConversationThreadPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [thread, setThread] = useState<ConversationThread | null>(null);
  /**
   * The summary opens beside the thread rather than replacing it: it's the
   * record of a conversation these two already had, so reading it while
   * still able to see — and answer — what they said next is the point.
   */
  const [summaryOpen, setSummaryOpen] = useState(false);

  const isClient = thread?.viewerRole === "client";
  const { counterpart, counterpartProfile, project, consultation } = thread ?? {};

  const justBooked =
    isClient &&
    consultation?.status === "scheduled" &&
    !thread?.messages.some((m) => m.senderRole === "client" && m.createdAt > consultation.createdAt);

  return (
    <div className="flex h-full min-w-0">
      {/* The thread column. Its own max-width does the shifting — with the
          panel open there is simply less room to centre in, so nothing has
          to be told to move. */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-gray-800 px-6 py-4">
          {/* A back link rather than the breadcrumb the sibling detail pages
              use: the counterpart's name is already the first line of the row
              below, so `Conversations › Name` would only repeat it. On desktop
              the sidebar can get you back too, but on mobile it's behind the
              drawer — this is the only way out that's actually on screen. */}
          <div className="mx-auto mb-3 max-w-3xl">
            <Link
              href="/conversations"
              className="-ml-1 inline-flex items-center gap-0.5 rounded-md py-0.5 pl-1 pr-2 text-xs text-gray-500 transition-colors hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <ChevronLeft className="size-3.5" aria-hidden />
              Conversations
            </Link>
          </div>
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
          className="min-h-0"
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
                    {consultation.status === "completed" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        aria-expanded={summaryOpen}
                        onClick={() => setSummaryOpen((open) => !open)}
                      >
                        <Video className="size-4" aria-hidden />
                        {summaryOpen ? "Hide summary" : "View summary"}
                      </Button>
                    ) : (
                      <Button asChild size="sm" variant="outline" className="gap-1.5">
                        <Link href={`/consultations/${consultation.id}`}>
                          <Video className="size-4" aria-hidden />
                          Join call
                        </Link>
                      </Button>
                    )}
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

      {/*
        A column on a wide screen, a sheet over the thread on a narrow one —
        below `lg` there isn't room for both, and a 320px-wide transcript is
        not a transcript.
      */}
      {summaryOpen && consultation && (
        <aside
          aria-label="Consultation summary"
          className="fixed inset-0 z-30 flex flex-col border-gray-800 bg-gray-975 lg:static lg:z-auto lg:w-[26rem] lg:shrink-0 lg:border-l"
        >
          <header className="flex shrink-0 items-center gap-3 border-b border-gray-800 px-5 py-4">
            <p className="min-w-0 flex-1 text-sm font-medium text-gray-50">Consultation summary</p>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full"
              onClick={() => setSummaryOpen(false)}
              aria-label="Close summary"
            >
              <X className="size-4" aria-hidden />
            </Button>
          </header>
          <div className="thin-scrollbar flex-1 overflow-y-auto p-5">
            <ConsultationSummary consultationId={consultation.id} variant="panel" />
          </div>
        </aside>
      )}
    </div>
  );
}
