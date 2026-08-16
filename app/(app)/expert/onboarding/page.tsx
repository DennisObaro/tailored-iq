"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExpertOnboardingStep, ExpertProfile } from "@/lib/types";
import * as expertApi from "@/lib/api/expert-onboarding";
import * as referralsApi from "@/lib/api/expert-referrals";
import { useSessionStore } from "@/lib/store/use-session-store";
import { ONBOARDING_STEPS, REQUIRED_STEPS } from "@/lib/constants/expert";
import { OnboardingProgress } from "@/components/expert/onboarding-progress";
import { BackgroundStep } from "@/components/expert/onboarding/background-step";
import { EvidenceStep } from "@/components/expert/onboarding/evidence-step";
import { ExpertiseStep } from "@/components/expert/onboarding/expertise-step";
import { HelpAreasStep } from "@/components/expert/onboarding/help-areas-step";
import { ContributionsStep } from "@/components/expert/onboarding/contributions-step";
import { VerificationStep } from "@/components/expert/onboarding/verification-step";
import { PoliciesStep } from "@/components/expert/onboarding/policies-step";
import { QuizStep } from "@/components/expert/onboarding/quiz-step";
import { AvailabilityStep } from "@/components/expert/onboarding/availability-step";
import { PreviewStep } from "@/components/expert/onboarding/preview-step";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ORDER = ONBOARDING_STEPS.map((s) => s.key);

/** First step that isn't finished yet — where an expert resumes. */
function resumeStep(profile: ExpertProfile): ExpertOnboardingStep {
  return ORDER.find((step) => !profile.completedSteps.includes(step)) ?? "preview";
}

export default function ExpertOnboardingPage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const refresh = useSessionStore((s) => s.refresh);

  const [profile, setProfile] = useState<ExpertProfile | null | undefined>(undefined);
  const [step, setStep] = useState<ExpertOnboardingStep>("background");
  const [referrerName, setReferrerName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const existing = await expertApi.getExpertProfile(user.id);
      if (cancelled) return;

      /**
       * The referral gate, enforced server-side by the profile's existence:
       * no claimed code means no profile, and no profile means this page
       * sends you back to the gate rather than letting you fill it in.
       */
      if (!existing) {
        router.replace("/become-an-expert");
        return;
      }
      if (existing.verificationStatus === "pending") {
        router.replace("/expert/pending");
        return;
      }

      setProfile(existing);
      setStep(resumeStep(existing));
      const referral = await referralsApi.getReferralForUser(user.id);
      if (!cancelled) setReferrerName(referral?.referrerName ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, router]);

  function advance(updated: ExpertProfile) {
    setProfile(updated);
    if (updated.verificationStatus === "pending") {
      void refresh();
      router.push("/expert/pending");
      return;
    }
    const index = ORDER.indexOf(step);
    setStep(ORDER[Math.min(index + 1, ORDER.length - 1)]);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    const index = ORDER.indexOf(step);
    if (index > 0) setStep(ORDER[index - 1]);
  }

  if (profile === undefined || !user) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (!profile) return null;

  const remaining = REQUIRED_STEPS.filter((s) => !profile.completedSteps.includes(s)).length;
  const stepProps = { profile, onSaved: advance, onBack: ORDER.indexOf(step) > 0 ? back : undefined };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6 lg:flex-row lg:gap-10">
      <aside className="lg:sticky lg:top-6 lg:h-fit lg:w-60 lg:shrink-0">
        <Card className="p-4">
          <p className="px-2 text-xs font-medium uppercase tracking-wide text-gray-500">Expert onboarding</p>
          <OnboardingProgress profile={profile} current={step} onStepClick={setStep} className="mt-3" />
          <div className="mt-3 border-t border-gray-800 px-2 pt-3">
            <Badge variant={remaining === 0 ? "success" : "outline"}>
              {remaining === 0 ? "Ready to submit" : `${remaining} step${remaining === 1 ? "" : "s"} left`}
            </Badge>
            {referrerName && <p className="mt-2 text-xs text-gray-500">Referred by {referrerName}</p>}
          </div>
        </Card>
      </aside>

      <div className="min-w-0 flex-1">
        {step === "background" && <BackgroundStep {...stepProps} />}
        {step === "evidence" && <EvidenceStep {...stepProps} />}
        {step === "expertise" && <ExpertiseStep {...stepProps} />}
        {step === "help_areas" && <HelpAreasStep {...stepProps} />}
        {step === "contributions" && <ContributionsStep {...stepProps} />}
        {step === "verification" && <VerificationStep {...stepProps} />}
        {step === "policies" && <PoliciesStep {...stepProps} />}
        {step === "quiz" && <QuizStep {...stepProps} />}
        {step === "availability" && <AvailabilityStep {...stepProps} />}
        {step === "preview" && <PreviewStep {...stepProps} user={user} onEditStep={setStep} />}
      </div>
    </div>
  );
}
