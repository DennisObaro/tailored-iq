"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, CheckCircle2 } from "@/components/icons";
import type { Brief, Conversation, Project } from "@/lib/types";
import * as projectsApi from "@/lib/api/projects";
import * as conversationsApi from "@/lib/api/conversations";
import * as briefsApi from "@/lib/api/briefs";
import * as expertsApi from "@/lib/api/experts";
import type { ExpertListing } from "@/lib/api/experts";
import * as reportsApi from "@/lib/api/reports";
import * as playbooksApi from "@/lib/api/playbooks";
import { ChatMessageBubble } from "@/components/chat/chat-message-bubble";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { ChatInput } from "@/components/chat/chat-input";
import { SuggestedExpertsPanel } from "@/components/chat/suggested-experts-panel";
import { ExpertCard } from "@/components/expert/expert-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BriefField } from "@/components/brief/brief-field";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { CHAT_THINKING_COPY, LOADING_COPY } from "@/lib/constants/loading-copy";

const BRIEF_FIELD_DEFS: { key: keyof Brief; label: string }[] = [
  { key: "situation", label: "Situation" },
  { key: "objective", label: "Goal" },
  { key: "constraints", label: "Constraints" },
  { key: "authority", label: "Authority" },
  { key: "desiredOutcome", label: "Desired outcome" },
];

export default function ChatConversationPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [confirmingBrief, setConfirmingBrief] = useState(false);
  const [stage, setStage] = useState<"report" | "matching" | "playbook" | null>(null);
  const [matchedExperts, setMatchedExperts] = useState<ExpertListing[]>([]);
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
        const b = await briefsApi.getBrief(p.briefId);
        if (!cancelled) setBrief(b);
      }
      if (p.matchedExpertIds.length > 0) {
        const listings = await expertsApi.getExpertsByIds(p.matchedExpertIds);
        if (!cancelled) setMatchedExperts(listings);
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
  }, [projectId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conversation?.messages.length, sending, brief, stage, matchedExperts.length, project?.reportId, project?.playbookId]);

  const briefRequestedRef = useRef(false);
  const initialResponseRequestedRef = useRef(false);
  const reportRequestedRef = useRef(false);
  const matchRequestedRef = useRef(false);

  useEffect(() => {
    if (
      !conversation ||
      conversation.turnCount > 0 ||
      conversation.messages.some((m) => m.role === "ai") ||
      initialResponseRequestedRef.current
    ) {
      return;
    }
    initialResponseRequestedRef.current = true;
    setSending(true);
    conversationsApi
      .startConversation(conversation.id)
      .then((updated) => {
        setConversation(updated);
        refreshSuggestions(updated);
      })
      .catch(() => setError(true))
      .finally(() => setSending(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation]);

  // Once the diagnosis wraps up, draft the brief and surface it inline as a
  // frame at the end of the thread — this used to redirect out to a
  // separate /brief page; now it stays part of the same conversation.
  useEffect(() => {
    if (conversation?.status === "complete" && project && !project.briefId && !briefRequestedRef.current) {
      briefRequestedRef.current = true;
      setGeneratingBrief(true);
      briefsApi
        .createBriefFromConversation(project.id)
        .then((newBrief) => {
          setBrief(newBrief);
          setProject((prev) => (prev ? { ...prev, briefId: newBrief.id, status: "brief_submitted" } : prev));
        })
        .catch(() => setError(true))
        .finally(() => setGeneratingBrief(false));
    }
  }, [conversation, project]);

  // Once the brief is confirmed, the report and expert-matching steps that
  // used to only appear after redirecting to /projects/[projectId] now run
  // and render inline here too, so the whole lifecycle stays in the chat.
  useEffect(() => {
    if (project?.status === "analysing" && !project.reportId && !reportRequestedRef.current) {
      reportRequestedRef.current = true;
      setStage("report");
      reportsApi
        .generateReportForProject(project.id)
        .then(() => projectsApi.getProject(project.id))
        .then((updated) => updated && setProject(updated))
        .catch(() => setError(true))
        .finally(() => setStage(null));
    }
  }, [project]);

  useEffect(() => {
    if (
      project?.status === "report_ready" &&
      project.matchedExpertIds.length === 0 &&
      !matchRequestedRef.current
    ) {
      matchRequestedRef.current = true;
      setStage("matching");
      expertsApi
        .matchExpertsForProject(project.id)
        .then((listings) => {
          setMatchedExperts(listings);
          return projectsApi.getProject(project.id);
        })
        .then((updated) => updated && setProject(updated))
        .catch(() => setError(true))
        .finally(() => setStage(null));
    }
  }, [project]);

  async function getPlaybook() {
    if (!project) return;
    setError(false);
    setStage("playbook");
    try {
      await playbooksApi.generatePlaybookForProject(project.id);
      const updated = await projectsApi.getProject(project.id);
      if (updated) setProject(updated);
    } catch {
      setError(true);
    } finally {
      setStage(null);
    }
  }

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

  function updateBriefField(key: keyof Brief, fieldValue: string) {
    setBrief((b) => (b ? { ...b, [key]: fieldValue } : b));
  }

  async function confirmBrief() {
    if (!brief) return;
    setConfirmingBrief(true);
    setError(false);
    try {
      await briefsApi.updateBrief(brief.id, brief);
      const confirmed = await briefsApi.confirmBrief(brief.id);
      setBrief(confirmed);
      const updated = await projectsApi.getProject(projectId);
      if (updated) setProject(updated);
    } catch {
      setError(true);
    } finally {
      setConfirmingBrief(false);
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
          <div ref={scrollRef} className="thin-scrollbar flex-1 space-y-7 overflow-y-auto px-10 py-8">
            {conversation.messages.map((m) => (
              <ChatMessageBubble key={m.id} message={m} />
            ))}
            {sending && <TypingIndicator />}
            {generatingBrief && <TypingIndicator label={CHAT_THINKING_COPY} />}

            {brief && (
              <Card className="p-4">
                <div>
                  <p className="text-sm font-semibold text-gray-50">Here&apos;s what I understand</p>
                  <p className="text-xs text-gray-500">Review and edit before we generate your report.</p>
                </div>
                <div className="mt-2 flex flex-col">
                  {BRIEF_FIELD_DEFS.map((f) => (
                    <BriefField
                      key={f.key}
                      label={f.label}
                      value={String(brief[f.key] ?? "")}
                      onChange={(v) => updateBriefField(f.key, v)}
                      disabled={confirmingBrief || brief.confirmed}
                    />
                  ))}
                </div>
                {brief.confirmed ? (
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-success-400">
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    Brief confirmed
                  </p>
                ) : (
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" loading={confirmingBrief} onClick={confirmBrief} className="gap-1.5">
                      <CheckCircle2 className="size-3.5" aria-hidden />
                      Confirm brief
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {stage === "report" && <TypingIndicator label={LOADING_COPY.report[0]} />}

            {project?.reportId && (
              <div className="flex flex-col gap-2">
                <p className="text-base leading-relaxed text-gray-100">Your report is ready.</p>
                <Button asChild size="sm" variant="outline" className="w-fit">
                  <Link href={`/reports/${project.reportId}`}>Read report</Link>
                </Button>
              </div>
            )}

            {stage === "matching" && <TypingIndicator label={LOADING_COPY.matching[0]} />}

            {matchedExperts.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-base leading-relaxed text-gray-100">
                  Before you act on it, I&apos;d recommend speaking with one of these experts — they&apos;ve
                  solved similar challenges and can sharpen your plan.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {matchedExperts.map((listing) => (
                    <ExpertCard key={listing.user.id} listing={listing} projectId={project?.id} />
                  ))}
                </div>
              </div>
            )}

            {stage === "playbook" && <TypingIndicator label={LOADING_COPY.playbook[0]} />}

            {project?.reportId && project.matchedExpertIds.length > 0 && !project.playbookId && stage !== "playbook" && (
              <div className="flex flex-col gap-2">
                <p className="text-base leading-relaxed text-gray-100">
                  {project.consultationId
                    ? "Now that you've spoken with an expert, I can turn your report and what you learned into a tailored playbook with concrete next steps."
                    : "Whenever you're ready, I can turn your report into a tailored playbook with concrete next steps — talking to an expert first can sharpen it, but isn't required."}
                </p>
                <Button size="sm" className="w-fit gap-1.5" onClick={getPlaybook}>
                  <BookOpen className="size-3.5" aria-hidden />
                  Get a playbook
                </Button>
              </div>
            )}

            {project?.playbookId && (
              <div className="flex flex-col gap-2">
                <p className="text-base leading-relaxed text-gray-100">
                  Your playbook is ready — a concrete plan for tackling this.
                </p>
                <Button asChild size="sm" variant="outline" className="w-fit">
                  <Link href={`/playbooks/${project.playbookId}`}>View playbook</Link>
                </Button>
              </div>
            )}
          </div>
          <div className="px-10 pb-8">
            <ChatInput onSend={handleSend} disabled={sending || generatingBrief || conversation.status === "complete"} />
          </div>
        </div>
      </div>
      <SuggestedExpertsPanel projectId={projectId} experts={suggestedExperts} loading={expertsLoading} />
    </div>
  );
}
