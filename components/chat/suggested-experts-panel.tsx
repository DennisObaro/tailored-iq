import { Sparkles } from "lucide-react";
import type { ExpertListing } from "@/lib/api/experts";
import { ExpertCard } from "@/components/expert/expert-card";
import { Skeleton } from "@/components/ui/skeleton";

export function SuggestedExpertsPanel({
  projectId,
  experts,
  loading,
}: {
  projectId: string;
  experts: ExpertListing[];
  loading: boolean;
}) {
  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-3 overflow-y-auto border-l border-gray-800 p-5 lg:flex">
      <h2 className="text-sm font-medium text-gray-300">Relevant to your challenge</h2>

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
        <div className="flex flex-col gap-3">
          {experts.map((listing) => (
            <ExpertCard key={listing.user.id} listing={listing} projectId={projectId} />
          ))}
        </div>
      )}
    </aside>
  );
}
