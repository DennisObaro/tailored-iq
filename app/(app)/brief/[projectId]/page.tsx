"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import type { Brief, Project } from "@/lib/types";
import * as projectsApi from "@/lib/api/projects";
import * as briefsApi from "@/lib/api/briefs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { BriefField } from "@/components/brief/brief-field";

const FIELD_DEFS: { key: keyof Brief; label: string; hint: string }[] = [
  { key: "situation", label: "Situation", hint: "What is happening?" },
  { key: "objective", label: "Goal", hint: "What does the user want to change?" },
  { key: "constraints", label: "Constraints", hint: "What limits the user?" },
  { key: "authority", label: "Authority", hint: "What can the user actually implement?" },
  { key: "desiredOutcome", label: "Desired outcome", hint: "What does success look like?" },
];

export default function BriefPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(false);

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
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function updateField(key: keyof Brief, value: string) {
    if (!brief) return;
    setBrief({ ...brief, [key]: value });
  }

  async function saveAndConfirm() {
    if (!brief) return;
    setConfirming(true);
    setError(false);
    try {
      await briefsApi.updateBrief(brief.id, brief);
      await briefsApi.confirmBrief(brief.id);
      router.push(`/projects/${projectId}`);
    } catch {
      setError(true);
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!brief || !project) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <ErrorState
          whatHappened="We couldn't find this brief."
          dataSafe="Nothing was lost — this project may still be generating its brief."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-50">Here&apos;s what I understand</h1>
        <p className="mt-1 text-sm text-gray-400">
          Review and edit before we generate your report. You can change anything here.
        </p>
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-5">
          {FIELD_DEFS.map((f) => (
            <BriefField
              key={f.key}
              label={f.label}
              hint={f.hint}
              value={String(brief[f.key] ?? "")}
              onChange={(v) => updateField(f.key, v)}
              disabled={confirming}
            />
          ))}
        </div>
      </Card>

      {error && (
        <ErrorState
          whatHappened="We couldn't confirm your brief."
          dataSafe="Your edits are safe and haven't been lost."
          onRetry={saveAndConfirm}
        />
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push(`/chat/${projectId}`)} disabled={confirming}>
          Add more context
        </Button>
        <Button loading={confirming} onClick={saveAndConfirm} className="gap-1.5">
          <CheckCircle2 className="size-4" aria-hidden />
          Confirm brief
        </Button>
      </div>
    </div>
  );
}
