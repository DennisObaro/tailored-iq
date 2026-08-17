"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Save, Send } from "@/components/icons";
import type { CallForInsight, ExpertContributionType, ExpertProfile, Project } from "@/lib/types";
import * as projectsApi from "@/lib/api/projects";
import * as contributionsApi from "@/lib/api/contributions";
import * as expertApi from "@/lib/api/expert-onboarding";
import { useSessionStore } from "@/lib/store/use-session-store";
import { CONTRIBUTION_TYPE_LABELS } from "@/lib/constants/expert";
import { getExpertAccess } from "@/lib/utils/expert-access";
import { ExpertGate } from "@/components/expert/expert-gate";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";

const KNOWLEDGE_TYPES: ExpertContributionType[] = [
  "insight",
  "case_study",
  "thought_leadership",
  "topic_suggestion",
  "expert_conversation",
];
const PROJECT_TYPES: ExpertContributionType[] = ["playbook_input", "review"];

const PROMPTS: Record<ExpertContributionType, string> = {
  insight: "What did you do, what happened, and what would you tell someone facing it now?",
  case_study: "Set out the situation, what you tried, what actually worked, and what you'd do differently.",
  thought_leadership: "Summarise the work and what a leader should take from it. Link to the original in your profile.",
  topic_suggestion: "What should the network be writing about, and why does it keep coming up?",
  expert_conversation: "What would you want to talk through on a recorded conversation, and with whom?",
  playbook_input: "Be specific and practical — what should this client do, and what happens if they don't?",
  review: "Where is the recommendation right, where is it thin, and what does it miss that you've seen go wrong?",
};

function NewContributionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useSessionStore((s) => s.user);

  const [profile, setProfile] = useState<ExpertProfile | null | undefined>(undefined);
  const [projects, setProjects] = useState<Project[]>([]);
  const [call, setCall] = useState<CallForInsight | null>(null);

  const [type, setType] = useState<ExpertContributionType>(
    (searchParams.get("type") as ExpertContributionType | null) ?? "insight",
  );
  const [projectId, setProjectId] = useState(searchParams.get("projectId") ?? "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const callId = searchParams.get("callId");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [p, projectList, callForInsight] = await Promise.all([
        expertApi.getExpertProfile(user.id),
        projectsApi.listProjectsForExpert(user.id),
        callId ? contributionsApi.getCallForInsight(callId) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setProfile(p);
      setProjects(projectList);
      setCall(callForInsight);
      if (callForInsight) setTitle((t) => t || "");
    })();
    return () => {
      cancelled = true;
    };
  }, [user, callId]);

  const isProjectType = PROJECT_TYPES.includes(type);
  const access = getExpertAccess(profile ?? null);

  async function save(submit: boolean) {
    if (!user) return;
    setSaving(submit ? "submit" : "draft");
    setError(null);
    try {
      const created = await contributionsApi.createContribution({
        expertId: user.id,
        type,
        title: title.trim(),
        content: content.trim(),
        projectId: isProjectType ? projectId : undefined,
        callForInsightId: call?.id,
        submit,
      });
      router.push(`/expert/contributions/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't save your contribution.");
      setSaving(null);
    }
  }

  if (profile === undefined) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const canWrite = isProjectType ? access.canAcceptWork : access.canContributeKnowledge;

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-50">New contribution</h1>
        <p className="mt-1 text-sm text-gray-400">
          Your contribution is always attributed to you and kept distinct from AI-generated content.
        </p>
      </div>

      <ExpertGate profile={profile ?? null} requires={isProjectType ? "accept" : "knowledge"}>
        {call && (
          <Card className="border-primary-500/30 bg-primary-500/5 p-4">
            <Badge variant="outline">Responding to a call for insight</Badge>
            <p className="mt-2 text-sm font-medium text-gray-100">{call.title}</p>
            <p className="mt-1 text-sm text-gray-400">{call.prompt}</p>
          </Card>
        )}

        <Card className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type">Type</Label>
            <Select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as ExpertContributionType)}
              disabled={!!call}
            >
              <optgroup label="Knowledge base (peer reviewed)">
                {KNOWLEDGE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {CONTRIBUTION_TYPE_LABELS[t]}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Client project work">
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {CONTRIBUTION_TYPE_LABELS[t]}
                  </option>
                ))}
              </optgroup>
            </Select>
            <p className="text-xs text-gray-500">
              {isProjectType
                ? "Goes straight to the client on that project, and into their playbook where there is one."
                : "Goes to peer review — another expert reads it before it's published to the network."}
            </p>
          </div>

          {isProjectType && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project">Project</Label>
              {projects.length === 0 ? (
                <ErrorState
                  whatHappened="You don't have any engaged projects yet."
                  dataSafe="Nothing has been lost."
                  nextStep="Accept an opportunity first, then come back to contribute to that client's work."
                />
              ) : (
                <Select id="project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">Select a project…</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Say the point in one line — e.g. Give new managers one decision to own"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="content">Your contribution</Label>
            <Textarea
              id="content"
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={PROMPTS[type]}
            />
            <p className="text-xs text-gray-500">
              {content.trim().length} characters. Write from what you did, not what&apos;s generally advised.
            </p>
          </div>

          {error && (
            <ErrorState
              whatHappened={error}
              dataSafe="Your draft above hasn't been lost."
              onRetry={() => save(false)}
            />
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              className="gap-1.5"
              loading={saving === "submit"}
              disabled={!canWrite || !title.trim() || !content.trim() || (isProjectType && !projectId)}
              onClick={() => save(true)}
            >
              <Send className="size-4" aria-hidden />
              {isProjectType ? "Send to the client" : "Submit for peer review"}
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              loading={saving === "draft"}
              disabled={!canWrite || !title.trim() || !content.trim()}
              onClick={() => save(false)}
            >
              <Save className="size-4" aria-hidden />
              Save draft
            </Button>
            <Button asChild variant="ghost">
              <Link href="/expert/contributions">Cancel</Link>
            </Button>
          </div>
        </Card>
      </ExpertGate>
    </div>
  );
}

export default function NewContributionPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl p-6"><Skeleton className="h-64 w-full" /></div>}>
      <NewContributionForm />
    </Suspense>
  );
}
