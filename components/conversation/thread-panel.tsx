"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUp, FileText, Upload, X } from "@/components/icons";
import type { ConversationThread } from "@/lib/api/expert-conversations";
import * as conversationsApi from "@/lib/api/expert-conversations";
import { useSessionStore } from "@/lib/store/use-session-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatRelative } from "@/lib/utils/format";

/**
 * The message list + composer for one ExpertConversation thread. Extracted
 * so the same UI can sit inside the full-page /conversations/[id] route and
 * inline inside an engagement workspace, without either forking the other's
 * bug fixes.
 */
export function ThreadPanel({
  conversationId,
  onThreadLoaded,
  onMessageSent,
  beforeMessages,
  suppressEmptyState,
  className,
  loadingFallback,
  notFoundFallback,
}: {
  conversationId: string;
  /** Lets a host read fields off the loaded thread (e.g. for its own header) without duplicating the fetch. */
  onThreadLoaded?: (thread: ConversationThread) => void;
  /** Called after a message send completes, so a host showing other data derived from this thread (e.g. an attachments list) can refresh. */
  onMessageSent?: () => void;
  /** Rendered above the message list, inside the same scroll container. */
  beforeMessages?: ReactNode;
  /** Set by a host that's already showing its own "nothing here yet" nudge (e.g. a just-booked-call card) — avoids a redundant empty state underneath it. */
  suppressEmptyState?: boolean;
  className?: string;
  /** Shown while the thread is loading; defaults to a bare spacer if omitted. */
  loadingFallback?: ReactNode;
  /** Shown when the conversation can't be found/viewed; defaults to a plain message if omitted. */
  notFoundFallback?: ReactNode;
}) {
  const user = useSessionStore((s) => s.user);
  const [thread, setThread] = useState<ConversationThread | null | undefined>(undefined);
  const [value, setValue] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      const result = await conversationsApi.getConversationThread(conversationId, user.id);
      if (cancelled) return;
      setThread(result);
      if (result) {
        onThreadLoaded?.(result);
        await conversationsApi.markConversationRead(conversationId, user.id);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [conversationId, user, onThreadLoaded]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [thread?.messages.length]);

  const reload = useCallback(async () => {
    if (!user) return;
    const result = await conversationsApi.getConversationThread(conversationId, user.id);
    setThread(result);
    if (result) {
      onThreadLoaded?.(result);
    }
  }, [conversationId, user, onThreadLoaded]);

  async function send() {
    if (!user || sending) return;
    if (!value.trim() && pendingFiles.length === 0) return;
    setSending(true);
    try {
      await conversationsApi.sendMessage({
        conversationId,
        senderId: user.id,
        content: value,
        attachments: pendingFiles.map((f) => ({ name: f.name, mimeType: f.type, sizeBytes: f.size })),
      });
      setValue("");
      setPendingFiles([]);
      await reload();
      onMessageSent?.();
    } finally {
      setSending(false);
    }
  }

  if (thread === undefined) {
    return loadingFallback ?? <div className={cn("min-h-0 flex-1", className)} />;
  }
  if (!thread) {
    return (
      notFoundFallback ?? (
        <p className={cn("p-6 text-sm text-gray-500", className)}>This conversation isn&apos;t available.</p>
      )
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div ref={scrollRef} className="thin-scrollbar min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
          {beforeMessages}

          {thread.messages.filter((m) => m.senderRole !== "system").length === 0 && !suppressEmptyState ? (
            <div className="rounded-lg border border-dashed border-gray-800 px-4 py-8 text-center">
              <p className="text-sm font-medium text-gray-200">Start the conversation</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                {thread.viewerRole === "client"
                  ? `Tell ${thread.counterpart.firstName} what you're trying to figure out, or ask a question about your challenge.`
                  : `Ask ${thread.counterpart.firstName} what they're trying to figure out, or share where your experience is relevant.`}
              </p>
            </div>
          ) : (
            thread.messages.map((message) => {
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
                    {mine ? "You" : thread.counterpart.firstName} · {formatRelative(message.createdAt)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-800 px-6 py-4">
        {pendingFiles.length > 0 && (
          <div className="mx-auto mb-2 flex max-w-3xl flex-wrap gap-1.5">
            {pendingFiles.map((f, i) => (
              <span
                key={`${f.name}-${i}`}
                className="flex items-center gap-1.5 rounded-lg border border-gray-800 px-2 py-1 text-xs text-gray-300"
              >
                <FileText className="size-3.5 text-gray-500" aria-hidden />
                {f.name}
                <button
                  type="button"
                  onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="size-3 text-gray-500" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length > 0) setPendingFiles((prev) => [...prev, ...files]);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="rounded-full"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach a file"
          >
            <Upload className="size-4" aria-hidden />
          </Button>
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
            disabled={!value.trim() && pendingFiles.length === 0}
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
