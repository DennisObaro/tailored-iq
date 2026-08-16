"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import * as api from "@/lib/api/expert-onboarding";
import { QUIZ_PASS_MARK, QUIZ_QUESTIONS } from "@/lib/constants/expert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StepShell, type StepProps } from "./step-shell";
import { cn } from "@/lib/utils/cn";

/**
 * The knowledge check is required, not decorative (spec §11): failing it
 * leaves the profile unable to be submitted, and the rationale shown after
 * each attempt is the point — an expert should leave understanding why an
 * answer was wrong, not just that it was.
 */
export function QuizStep({ profile, onSaved, onBack }: StepProps) {
  const [choices, setChoices] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<api.QuizResult | null>(null);

  const answeredAll = QUIZ_QUESTIONS.every((q) => choices[q.id] !== undefined);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const outcome = await api.submitQuiz(profile.userId, choices);
      setResult(outcome);
      if (outcome.passed) {
        const updated = await api.getExpertProfile(profile.userId);
        if (updated) onSaved(updated);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't mark your answers just now.");
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    setChoices({});
    setResult(null);
  }

  if (result && !result.passed) {
    return (
      <StepShell
        title="Not quite yet"
        blurb={`You got ${result.attempt.score} of ${result.attempt.total}. You need ${QUIZ_PASS_MARK} to pass. Have another look at the questions below, then try again — there's no limit on attempts.`}
        onBack={onBack}
        hideNext
      >
        <Card>
          <CardHeader>
            <CardTitle>What to revisit</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {QUIZ_QUESTIONS.filter((q) => result.incorrectQuestionIds.includes(q.id)).map((q) => (
              <div key={q.id} className="flex flex-col gap-1.5">
                <p className="flex items-start gap-2 text-sm text-gray-100">
                  <XCircle className="mt-0.5 size-4 shrink-0 text-danger-400" aria-hidden />
                  {q.prompt}
                </p>
                <p className="pl-6 text-sm text-gray-400">{q.rationale}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Button onClick={retry} className="gap-1.5 self-start" size="lg">
          <RotateCcw className="size-4" aria-hidden />
          Try again
        </Button>
      </StepShell>
    );
  }

  if (result?.passed) {
    return (
      <StepShell title="Knowledge check passed" blurb={`${result.attempt.score} out of ${result.attempt.total}.`} hideNext>
        <Card className="flex items-start gap-3 border-success-500/30 bg-success-500/5 p-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success-400" aria-hidden />
          <p className="text-sm text-gray-200">
            That&apos;s the required part of onboarding done. One more step — how you want to be booked — and you can
            submit your profile.
          </p>
        </Card>
      </StepShell>
    );
  }

  return (
    <StepShell
      title="Knowledge check"
      blurb={`Six situations you'll actually meet as a TailoredIQ expert. You need ${QUIZ_PASS_MARK} of ${QUIZ_QUESTIONS.length} to pass, and you can retake it as many times as you need.`}
      onNext={submit}
      onBack={onBack}
      saving={submitting}
      error={error}
      nextDisabled={!answeredAll}
      nextLabel="Submit answers"
      footerNote={!answeredAll ? `${Object.keys(choices).length} of ${QUIZ_QUESTIONS.length} answered` : undefined}
    >
      {QUIZ_QUESTIONS.map((question, index) => (
        <Card key={question.id}>
          <CardHeader>
            <div className="flex items-start gap-2">
              <Badge variant="outline">{index + 1}</Badge>
              <CardTitle className="leading-relaxed">{question.prompt}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {question.choices.map((choice, choiceIndex) => {
              const selected = choices[question.id] === choiceIndex;
              return (
                <label
                  key={choice}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm transition-colors",
                    selected ? "border-primary-500 bg-primary-500/5 text-gray-50" : "border-gray-800 text-gray-300 hover:bg-gray-850",
                  )}
                >
                  <input
                    type="radio"
                    name={question.id}
                    checked={selected}
                    onChange={() => setChoices((prev) => ({ ...prev, [question.id]: choiceIndex }))}
                    className="mt-0.5 size-4 shrink-0 accent-[var(--color-primary-500)]"
                  />
                  {choice}
                </label>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </StepShell>
  );
}
