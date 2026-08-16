"use client";

import { useState } from "react";
import { Eye, Send } from "lucide-react";
import type { ExpertOnboardingStep, User } from "@/lib/types";
import * as api from "@/lib/api/expert-onboarding";
import { ONBOARDING_STEPS, REQUIRED_STEPS } from "@/lib/constants/expert";
import { ExpertProfilePreview } from "@/components/expert/expert-profile-preview";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StepShell, type StepProps } from "./step-shell";

export function PreviewStep({
  profile,
  user,
  onSaved,
  onBack,
  onEditStep,
}: StepProps & { user: User; onEditStep: (step: ExpertOnboardingStep) => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missing = REQUIRED_STEPS.filter((s) => !profile.completedSteps.includes(s));

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      onSaved(await api.submitForReview(profile.userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't submit your profile just now.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <StepShell
      title="How clients will see you"
      blurb="This is your profile exactly as it appears to a leader deciding whether your experience fits their challenge."
      onNext={submit}
      onBack={onBack}
      saving={saving}
      error={error}
      nextDisabled={missing.length > 0}
      nextLabel="Submit for review"
    >
      <Card className="flex items-start gap-2.5 border-primary-500/30 bg-primary-500/5 p-4">
        <Eye className="mt-0.5 size-4 shrink-0 text-primary-400" aria-hidden />
        <p className="text-sm text-gray-200">
          Nothing here is public yet. Once you submit, a reviewer checks your background against the evidence you gave us.
        </p>
      </Card>

      <ExpertProfilePreview user={user} profile={profile} />

      {missing.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-medium text-gray-100">Still to finish before you can submit</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {missing.map((step) => (
              <li key={step}>
                <Button variant="ghost" size="sm" onClick={() => onEditStep(step)} className="gap-1.5">
                  <Send className="size-3.5" aria-hidden />
                  {ONBOARDING_STEPS.find((s) => s.key === step)?.label ?? step}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </StepShell>
  );
}
