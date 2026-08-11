import { Check } from "lucide-react";
import { PROJECT_STATUS_ORDER, PROJECT_TIMELINE_STEPS, type ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

export function ProjectTimeline({ status }: { status: ProjectStatus }) {
  const currentIndex = PROJECT_STATUS_ORDER.indexOf(status);

  return (
    <ol className="flex flex-col gap-0">
      {PROJECT_TIMELINE_STEPS.map((step, i) => {
        const stepIndex = PROJECT_STATUS_ORDER.indexOf(step.status);
        const done = stepIndex <= currentIndex;
        const isLast = i === PROJECT_TIMELINE_STEPS.length - 1;
        return (
          <li key={step.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                  done
                    ? "border-primary-500 bg-primary-500 text-gray-975"
                    : "border-gray-700 bg-gray-900 text-gray-600",
                )}
              >
                {done && <Check className="size-3" aria-hidden />}
              </span>
              {!isLast && <span className={cn("w-px flex-1 min-h-6", done ? "bg-primary-500/50" : "bg-gray-800")} />}
            </div>
            <span className={cn("pb-6 text-sm", done ? "text-gray-100" : "text-gray-500")}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
