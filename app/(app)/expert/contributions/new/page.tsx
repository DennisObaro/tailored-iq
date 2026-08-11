"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send } from "lucide-react";
import type { Project } from "@/lib/types";
import * as projectsApi from "@/lib/api/projects";
import * as contributionsApi from "@/lib/api/contributions";
import { useSessionStore } from "@/lib/store/use-session-store";
import { Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";

export default function NewContributionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useSessionStore((s) => s.user);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(searchParams.get("projectId") ?? "");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    projectsApi.listProjectsForExpert(user.id).then((list) => {
      setProjects(list);
      if (!projectId && list.length > 0) setProjectId(list[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function submit() {
    if (!user || !projectId || !content.trim()) return;
    setSubmitting(true);
    setError(false);
    try {
      await contributionsApi.addContribution({ expertId: user.id, projectId, content: content.trim() });
      setSubmitted(true);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6 pt-16 text-center">
        <h1 className="text-xl font-semibold text-gray-50">Contribution added</h1>
        <p className="text-sm text-gray-400">
          Your input has been added to the client&apos;s project and, where applicable, their playbook.
        </p>
        <Button onClick={() => router.push(`/expert/projects/${projectId}`)}>Back to project</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-50">Contribute an insight</h1>
        <p className="mt-1 text-sm text-gray-400">
          Your input will be clearly attributed to you, distinct from AI-generated content.
        </p>
      </div>

      {projects.length === 0 ? (
        <ErrorState
          whatHappened="You don't have any engaged projects yet."
          dataSafe="Nothing has been lost."
          nextStep="Accept an opportunity first, then come back here to contribute."
        />
      ) : (
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project">Project</Label>
            <Select id="project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="content">Your input</Label>
            <Textarea
              id="content"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share a specific, practical recommendation based on your experience..."
            />
          </div>
          {error && (
            <ErrorState
              whatHappened="We couldn't save your contribution."
              dataSafe="Your draft text above hasn't been lost."
              onRetry={submit}
            />
          )}
          <Button loading={submitting} disabled={!content.trim()} onClick={submit} className="gap-1.5 self-start">
            <Send className="size-4" aria-hidden />
            Submit contribution
          </Button>
        </Card>
      )}
    </div>
  );
}
