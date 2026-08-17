import { AlertTriangle } from "@/components/icons";
import { Button } from "./button";
import { cn } from "@/lib/utils/cn";

/**
 * Every error must answer: what happened, whether the user's data is safe,
 * and what to do next (PRD §37). `whatHappened` and `dataSafe` are required
 * so call sites can't skip them.
 */
export function ErrorState({
  whatHappened,
  dataSafe,
  nextStep = "Try again, or contact support if this keeps happening.",
  onRetry,
  className,
}: {
  whatHappened: string;
  dataSafe: string;
  nextStep?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-danger-500/30 bg-danger-500/5 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-danger-500/15 text-danger-400">
        <AlertTriangle className="size-5" aria-hidden />
      </div>
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-sm font-semibold text-gray-50">{whatHappened}</p>
        <p className="text-sm text-gray-400">{dataSafe}</p>
        <p className="text-sm text-gray-400">{nextStep}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
