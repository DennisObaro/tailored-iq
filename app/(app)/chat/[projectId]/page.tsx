"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Conversation, Project } from "@/lib/types";
import * as projectsApi from "@/lib/api/projects";
import * as conversationsApi from "@/lib/api/conversations";
import * as briefsApi from "@/lib/api/briefs";
import * as expertsApi from "@/lib/api/experts";
import type { ExpertListing } from "@/lib/api/experts";
import { ChatMessageBubble } from "@/components/chat/chat-message-bubble";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { ChatInput } from "@/components/chat/chat-input";
import { SuggestedExpertsPanel } from "@/components/chat/suggested-experts-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { CHAT_THINKING_COPY } from "@/lib/constants/loading-copy";

export default function ChatConversationPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [error, setError] = useState(false);
  const [suggestedExperts, setSuggestedExperts] = useState<ExpertListing[]>([]);
  const [expertsLoading, setExpertsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function refreshSuggestions(convo: Conversation) {
    if (convo.status === "complete") return;
    setExpertsLoading(true);
    try {
      const listings = await expertsApi.suggestExpertsForConversation(projectId);
      setSuggestedExperts(listings);
    } finally {
      setExpertsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const p = await projectsApi.getProject(projectId);
      if (!p || cancelled) return;
      setProject(p);
      if (p.briefId) {
        router.replace(`/brief/${p.id}`);
        return;
      }
      const c = p.conversationId ? await conversationsApi.getConversation(p.conversationId) : null;
      if (cancelled) return;
      setConversation(c);
      setLoading(false);
      if (c) refreshSuggestions(c);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, router]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conversation?.messages.length, sending]);

  const briefRequestedRef = useRef(false);

  useEffect(() => {
    if (conversation?.status === "complete" && project && !project.briefId && !briefRequestedRef.current) {
      briefRequestedRef.current = true;
      Promise.resolve()
        .then(() => setGeneratingBrief(true))
        .then(() => briefsApi.createBriefFromConversation(project.id))
        .then(() => router.replace(`/brief/${project.id}`))
        .catch(() => setError(true));
    }
  }, [conversation, project, router]);

  async function handleSend(content: string) {
    if (!conversation) return;
    setSending(true);
    try {
      const updated = await conversationsApi.postMessage(conversation.id, content);
      setConversation(updated);
      refreshSuggestions(updated);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex h-full max-w-2xl flex-col gap-4 p-6">
        <Skeleton className="h-16 w-3/4" />
        <Skeleton className="h-16 w-2/3 self-end" />
        <Skeleton className="h-16 w-3/4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <ErrorState
          whatHappened="We couldn't process that message."
          dataSafe="Your conversation so far has been saved."
          onRetry={() => setError(false)}
        />
      </div>
    );
  }

  if (!conversation) return null;

  return (
    <div className="flex h-full">
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
            {conversation.messages.map((m) => (
              <ChatMessageBubble key={m.id} message={m} />
            ))}
            {sending && <TypingIndicator />}
            {generatingBrief && <TypingIndicator label={CHAT_THINKING_COPY} />}
          </div>
          <div className="px-6 pb-6">
            <ChatInput onSend={handleSend} disabled={sending || generatingBrief || conversation.status === "complete"} />
          </div>
        </div>
      </div>
      <SuggestedExpertsPanel projectId={projectId} experts={suggestedExperts} loading={expertsLoading} />
    </div>
  );
}
