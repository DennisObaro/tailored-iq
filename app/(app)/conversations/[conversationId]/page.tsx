"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowUp, Calendar, ChevronRight, FileText, Video } from "@/components/icons";
import type { ConversationThread } from "@/lib/api/expert-conversations";
import * as conversationsApi from "@/lib/api/expert-conversations";
import { useSessionStore } from "@/lib/store/use-session-store";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCallWhen, formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export default function ConversationThreadPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const user = useSessionStore((s) => s.user);
  const [thread, setThread] = useState<ConversationThread | null | undefined>(undefined);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const result = await conversationsApi.getConversationThread(conversationId, user.id);
    setThread(result);
    if (result) await conversationsApi.markConversationRead(conversationId, user.id);
  }, [conversationId, user]);

  useEffect(() => {
    let cancelled = false;
    async function open() {
      if (!user) return;
      const result = await conversationsApi.getConversationThread(conversationId, user.id);
      if (cancelled) return;
      setThread(result);
      // Opening the thread is what marks it read — the unread badge should
      // clear because you looked at it, not because a message arrived.
      if (result) await conversationsApi.markConversationRead(conversationId, user.id);
    }
    open();
    return () => {
      cancelled = true;
    };
  }, [conversationId, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [thread?.messages.length]);

  async function send() {
    if (!user || !value.trim() || sending) return;
    setSending(true);
    try {
      await conversationsApi.sendMessage({ conversationId, senderId: user.id, content: value });
      setValue("");
      await load();
    } finally {
      setSending(false);
    }
  }

  if (thread === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <ErrorState
          whatHappened="We couldn't find this conversation."
          dataSafe="Nothing has been lost."
        />
      </div>
    );
  }

  const { counterpart, counterpartProfile, project, consultation, viewerRole } = thread;
  const isClient = viewerRole === "client";

  /**
   * The nudge a client sees right after booking. Derived rather than stored:
   * it shows while a call is scheduled and the client hasn't said anything
   * since booking it, so it clears itself the moment they do — and it never
   * appears for the expert, who doesn't need encouraging to use their own
   * inbox.
   */
  const justBooked =
    isClient &&
    consultation?.status === "scheduled" &&
    !thread.messages.some(
      (m) => m.senderRole === "client" && m.createdAt > consultation.createdAt,
    );

  return (
    <div className="flex h-full flex-col">
      {/* Who, and what about — the expert should never have to guess why
          they're being contacted, so the challenge sits in the header. */}
      <header className="shrink-0 border-b border-gray-800 px-6 py-4">
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
          <StatusBadge status={thread.stage} />
        </div>
      </header>

      <div ref={scrollRef} className="thin-scrollbar min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
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
                Your call with {counterpart.firstName} is booked.
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Share anything useful before you speak — context, documents, what you most want to get out of
                it. {counterpart.firstName} can read it beforehand.
              </p>
            </Card>
          )}

          {thread.messages.filter((m) => m.senderRole !== "system").length === 0 && !justBooked ? (
            <div className="rounded-lg border border-dashed border-gray-800 px-4 py-8 text-center">
              <p className="text-sm font-medium text-gray-200">Start the conversation</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                {isClient
                  ? `Tell ${counterpart.firstName} what you're trying to figure out, or ask a question about your challenge.`
                  : `Ask ${counterpart.firstName} what they're trying to figure out, or share where your experience is relevant.`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {thread.messages.map((message) => {
                if (message.senderRole === "system") {
                  return (
                    <p key={message.id} className="text-center text-xs text-gray-500">
                      {message.content}
                    </p>
                  );
                }
                const mine = message.senderId === user?.id;
                return (
                  <div key={message.id} className={cn("flex flex-col gap-1", mine && "items-end")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                        mine ? "bg-gray-850 text-gray-50" : "bg-gray-900 text-gray-200",
                      )}
                    >
                      {message.content}
                      {message.attachments.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1.5">
                          {message.attachments.map((attachment) => (
                            <span
                              key={attachment.id}
                              className="flex items-center gap-2 rounded-lg border border-gray-800 px-2.5 py-1.5 text-xs text-gray-300"
                            >
                              <FileText className="size-3.5 shrink-0 text-gray-500" aria-hidden />
                              {attachment.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="px-1 text-xs text-gray-500">
                      {mine ? "You" : counterpart.firstName} · {formatRelative(message.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-800 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="What would you like to discuss?"
            rows={1}
            disabled={sending}
            className="max-h-32 flex-1 resize-none rounded-2xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-gray-50 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50"
          />
          <Button
            size="icon"
            className="rounded-full"
            loading={sending}
            disabled={!value.trim()}
            onClick={send}
            aria-label="Send message"
          >
            <ArrowUp className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
