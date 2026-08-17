import { Loader2, Sparkles } from "@/components/icons";
import type { ExpertListing } from "@/lib/api/experts";
import { ExpertCard } from "@/components/expert/expert-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

export function SuggestedExpertsPanel({
  projectId,
  experts,
  loading,
}: {
  projectId: string;
  experts: ExpertListing[];
  loading: boolean;
}) {
  const refreshing = loading && experts.length > 0;

  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-3 overflow-y-auto border-l border-gray-800 p-5 lg:flex">
      {/*
        Every answer narrows the match, so the heading says which of the two
        things is true right now: still choosing, or here's who fits. It's
        the only cue that the panel is reacting to what was just typed —
        the cards themselves often change by one name or not at all.
      */}
      <div className="flex items-center gap-2">
        <h2 aria-live="polite" className="text-sm font-medium text-gray-300">
          {loading ? "Choosing the best experts for you" : "Relevant experts for you"}
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
          <p className="text-xs text-gray-500">
            Still learning about your challenge — relevant experience will show up here as we talk.
          </p>
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
