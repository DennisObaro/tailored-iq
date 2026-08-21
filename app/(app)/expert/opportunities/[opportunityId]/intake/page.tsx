"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Save, Send, CheckCircle2 } from "@/components/icons";
import type { ExpertProfile } from "@/lib/types";
import * as intakeApi from "@/lib/api/intake";
import * as expertApi from "@/lib/api/expert-onboarding";
import { useSessionStore } from "@/lib/store/use-session-store";
import { ExpertGate } from "@/components/expert/expert-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";

/**
 * The intake companion's workspace. The expert runs the call, works down the
 * questions TailoredIQ prepared, and captures what the client says. Saving is
 * separate from submitting because this gets filled in live, mid-conversation.
 */
export default function IntakePage() {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const user = useSessionStore((s) => s.user);

  const [session, setSession] = useState<intakeApi.IntakeSession | null | undefined>(undefined);
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [busy, setBusy] = useState<"save" | "submit" | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [result, p] = await Promise.all([
        intakeApi.getIntakeSession(opportunityId, user.id),
        expertApi.getExpertProfile(user.id),
      ]);
      if (cancelled) return;
      setSession(result);
      setProfile(p);
      if (result) {
        setAnswers(result.answers);
        setSubmitted(result.submitted);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [opportunityId, user]);

  function setAnswer(index: number, value: string) {
    setSaved(false);
    setAnswers((prev) => prev.map((a, i) => (i === index ? value : a)));
  }

  async function save() {
    if (!user) return;
    setBusy("save");
    setError(null);
    try {
      await intakeApi.saveIntakeAnswers(opportunityId, user.id, answers);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't save that just now.");
    } finally {
      setBusy(null);
    }
  }

  async function submit() {
    if (!user) return;
    setBusy("submit");
    setError(null);
    try {
      // Save first: submit reads the answers back off the stored record.
      await intakeApi.saveIntakeAnswers(opportunityId, user.id, answers);
      await intakeApi.submitIntakeBrief(opportunityId, user.id);
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't submit the brief.");
    } finally {
      setBusy(null);
    }
  }

  if (session === undefined) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <ErrorState
          whatHappened="We couldn't find this intake."
          dataSafe="Nothing has been lost."
          nextStep="Check your opportunities — it may not be an intake, or not yours."
        />
      </div>
    );
  }

  const { opportunity, project, questions } = session;
  const complete = answers.every((a) => a.trim().length > 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <div className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/expert/opportunities" className="hover:text-gray-300">
            Opportunities
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <Link href={`/expert/opportunities/${opportunity.id}`} className="hover:text-gray-300">
            {opportunity.title}
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span className="text-gray-300">Intake</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-50">Client intake</h1>
        <p className="mt-2 text-sm text-gray-400">
          Work down these with the client and capture what they say. You&apos;re completing their brief on their
          behalf — it goes to TailoredIQ, not straight back to them.
        </p>
      </div>

      <ExpertGate profile={profile} requires="clientDetail">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>What they came with</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300">{project.challenge}</p>
            </CardContent>
          </Card>

          {submitted ? (
            <Card className="flex flex-col gap-3 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-success-400" aria-hidden />
                <p className="text-sm font-medium text-gray-50">Brief submitted.</p>
              </div>
              <p className="text-sm text-gray-400">
                It&apos;s in the pipeline now — TailoredIQ is working up the executive summary. The client can see
                it on their project.
              </p>
              <Button asChild size="sm" variant="outline" className="self-start">
                <Link href={`/expert/projects/${project.id}`}>Open the project</Link>
              </Button>
            </Card>
          ) : (
            <>
              <Card className="flex flex-col gap-5 p-4">
                {questions.map((question, i) => (
                  <div key={question} className="flex flex-col gap-1.5">
                    <Label htmlFor={`q${i}`}>
                      <span className="mr-1.5 tabular-nums text-gray-500">{i + 1}.</span>
                      {question}
                    </Label>
                    <Textarea
                      id={`q${i}`}
                      rows={3}
                      value={answers[i] ?? ""}
                      onChange={(e) => setAnswer(i, e.target.value)}
                      placeholder="What they said, in their words where you can."
                    />
                  </div>
                ))}
              </Card>

              {error && <ErrorState whatHappened={error} dataSafe="Your answers above haven't been lost." />}

              <div className="flex flex-wrap items-center gap-2">
                <Button className="gap-1.5" loading={busy === "submit"} disabled={!complete} onClick={submit}>
                  <Send className="size-4" aria-hidden />
                  Submit brief
                </Button>
                <Button variant="outline" className="gap-1.5" loading={busy === "save"} onClick={save}>
                  <Save className="size-4" aria-hidden />
                  Save progress
                </Button>
                <span className="text-xs text-gray-500">
                  {!complete
                    ? "Answer every question to submit."
                    : saved
                      ? "Progress saved."
                      : "Ready to submit."}
                </span>
              </div>
            </>
          )}
        </div>
      </ExpertGate>
    </div>
  );
}
