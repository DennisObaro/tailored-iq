import { Check } from "@/components/icons";
import type { ExpertOnboardingStep, ExpertProfile } from "@/lib/types";
import { ONBOARDING_STEPS } from "@/lib/constants/expert";
import { cn } from "@/lib/utils/cn";

/**
 * The onboarding checklist (spec §11). Used both as the wizard's rail and
 * as the pending-approval progress list, so an expert sees the same set of
 * steps in the same order wherever they look.
 */
export function OnboardingProgress({
  profile,
  current,
  onStepClick,
  className,
}: {
  profile: ExpertProfile | null;
  current?: ExpertOnboardingStep;
  onStepClick?: (step: ExpertOnboardingStep) => void;
  className?: string;
}) {
  const done = profile?.completedSteps ?? [];

  return (
    <ol className={cn("flex flex-col gap-0.5", className)}>
      {ONBOARDING_STEPS.map((step) => {
        const isDone = done.includes(step.key);
        const isCurrent = current === step.key;
        // Only a step you've already finished is safe to jump back to.
        const clickable = !!onStepClick && (isDone || isCurrent);

        const content = (
          <>
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium",
                isDone
                  ? "border-success-500 bg-success-500/15 text-success-400"
                  : isCurrent
                    ? "border-primary-500 bg-primary-500/15 text-primary-400"
                    : "border-gray-800 text-gray-600",
              )}
            >
              {isDone ? <Check className="size-3" aria-hidden /> : ONBOARDING_STEPS.indexOf(step) + 1}
            </span>
            <span className={cn("truncate", isCurrent ? "text-gray-50" : isDone ? "text-gray-300" : "text-gray-500")}>
              {step.label}
            </span>
          </>
        );

        return (
          <li key={step.key}>
            {clickable ? (
              <button
                type="button"
                onClick={() => onStepClick(step.key)}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left text-sm transition-colors",
                  isCurrent ? "bg-gray-900" : "hover:bg-gray-900",
                )}
              >
                {content}
              </button>
            ) : (
              <div
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-sm",
                  isCurrent && "bg-gray-900",
                )}
              >
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
