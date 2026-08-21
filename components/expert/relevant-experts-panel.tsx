import { Loader2, Sparkles } from "@/components/icons";
import type { ExpertListing } from "@/lib/api/experts";
import { ExpertCard } from "@/components/expert/expert-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

/**
 * Which question the panel is answering. `potential` is the open state — the
 * brief isn't confirmed, nothing has been decided, so the list is wide and
 * browsable. `relevant` is the committed state: these are the people actually
 * matched to the confirmed brief.
 */
export type ExpertsPanelVariant = "potential" | "relevant";

const HEADINGS: Record<ExpertsPanelVariant, { settled: string; loading: string }> = {
  potential: {
    settled: "Potential experts you could talk to",
    loading: "Finding experts you could talk to",
  },
  relevant: {
    settled: "Relevant experts for you",
    loading: "Choosing the best experts for you",
  },
};

export function RelevantExpertsPanel({
  projectId,
  experts,
  loading,
  variant = "relevant",
  emptyMessage = "Relevant experience will show up here as we learn more about your challenge.",
  className,
}: {
  projectId?: string;
  experts: ExpertListing[];
  loading: boolean;
  variant?: ExpertsPanelVariant;
  emptyMessage?: string;
  /** Placement belongs to the caller: a full-height column in chat, a sticky rail beside a document. */
  className?: string;
}) {
  const refreshing = loading && experts.length > 0;

  return (
    <aside className={cn("flex flex-col gap-3", className)}>
      {/*
        Every answer re-ranks the list, so the heading says which of the two
        things is true right now: still working, or here's the answer. It's
        the only cue that the panel is reacting to what was just typed —
        the cards themselves often change by one name or not at all.
      */}
      <div className="flex items-center gap-2">
        <h2 aria-live="polite" className="text-sm font-medium text-gray-300">
          {loading ? HEADINGS[variant].loading : HEADINGS[variant].settled}
        </h2>
        {loading && <Loader2 className="size-3 shrink-0 animate-spin text-gray-500" aria-hidden />}
      </div>

      {loading && experts.length === 0 ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : experts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-800 px-4 py-10 text-center">
          <Sparkles className="size-4 text-gray-600" aria-hidden />
          <p className="text-xs text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className={cn("flex flex-col gap-3 transition-opacity", refreshing && "opacity-60")}>
          {experts.map((listing) => (
            <ExpertCard key={listing.user.id} listing={listing} projectId={projectId} />
          ))}
        </div>
      )}
    </aside>
  );
}
