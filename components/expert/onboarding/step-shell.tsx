"use client";

import { Check, type IconComponent } from "@/components/icons";
import type { ExpertProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export interface StepProps {
  profile: ExpertProfile;
  onSaved: (profile: ExpertProfile) => void;
  onBack?: () => void;
}

/** Shared frame for every onboarding step: title, body, one forward action. */
export function StepShell({
  title,
  blurb,
  children,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  saving,
  error,
  onBack,
  footerNote,
  hideNext,
}: {
  title: string;
  blurb?: string;
  children: React.ReactNode;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  saving?: boolean;
  error?: string | null;
  onBack?: () => void;
  footerNote?: React.ReactNode;
  hideNext?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-50">{title}</h1>
        {blurb && <p className="mt-1.5 text-sm text-gray-400">{blurb}</p>}
      </div>

      {children}

      <FieldError>{error}</FieldError>

      <div className="flex flex-wrap items-center gap-3">
        {onBack && (
          <Button variant="ghost" onClick={onBack} disabled={saving}>
            Back
          </Button>
        )}
        {!hideNext && onNext && (
          <Button onClick={onNext} loading={saving} disabled={nextDisabled} size="lg">
            {nextLabel}
          </Button>
        )}
        {footerNote && <span className="text-xs text-gray-500">{footerNote}</span>}
      </div>
    </div>
  );
}

/** Selectable chip used across the multi-select steps. */
export function ChipToggle({
  selected,
  onToggle,
  children,
  className,
}: {
  selected: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-975",
        selected
          ? "border-primary-500 bg-primary-500/15 text-primary-400"
          : "border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Larger selectable card for options that need a description. */
/**
 * A pick-what-applies card. Selection reads as a checked box and a lighter
 * border rather than an accent colour — these sit in grids where several
 * are picked at once, and an accent on each one turns the whole grid into
 * a highlight. `h-full` so a grid row of them shares one height however
 * long the descriptions run.
 */
export function OptionCard({
  selected,
  onToggle,
  title,
  description,
  icon: Icon,
}: {
  selected: boolean;
  onToggle: () => void;
  title: string;
  description: string;
  icon?: IconComponent;
}) {
  return (
    <Card
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        "flex h-full cursor-pointer gap-3 p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
        selected ? "border-gray-600 bg-gray-900" : "hover:bg-gray-900",
      )}
    >
      {Icon && (
        <span
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
            selected ? "border-gray-600 bg-gray-850 text-gray-100" : "border-gray-800 bg-gray-900 text-gray-400",
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", selected ? "text-gray-50" : "text-gray-100")}>{title}</p>
        <p className="mt-1 text-xs text-gray-400">{description}</p>
      </div>
      <span
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
          selected ? "border-gray-300 bg-gray-100 text-gray-950" : "border-gray-700",
        )}
        aria-hidden
      >
        {selected && <Check className="size-3" strokeWidth={3} />}
      </span>
    </Card>
  );
}
