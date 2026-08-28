"use client";

import { useEffect, useState } from "react";
import * as engagementsApi from "@/lib/api/engagements";
import type { EngagementListing } from "@/lib/api/engagements";
import { EngagementCard } from "@/components/engagement/engagement-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionStore } from "@/lib/store/use-session-store";

type Bucket = "in_progress" | "rating" | "completed";

function bucketOf(listing: EngagementListing): Bucket {
  if (listing.engagement.status !== "completed") return "in_progress";
  return listing.myReview ? "completed" : "rating";
}

const BUCKETS: [Bucket, string][] = [
  ["in_progress", "In progress"],
  ["rating", "Rating"],
  ["completed", "Completed"],
];

export default function EngagementsPage() {
  const user = useSessionStore((s) => s.user);
  const [listings, setListings] = useState<EngagementListing[] | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    engagementsApi.listEngagementsForClient(user.id).then(setListings);
  }, [user]);

  if (listings === undefined) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-50">Projects</h1>
        <p className="mt-1 text-sm text-gray-400">Experts helping you put your playbooks into practice.</p>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          title="No implementation projects yet"
          description="Book time with an expert from a finished playbook's implementation panel to start one."
        />
      ) : (
        BUCKETS.map(([key, label]) => {
          const items = listings.filter((l) => bucketOf(l) === key);
          if (items.length === 0) return null;
          return (
            <div key={key}>
              <h2 className="mb-3 text-sm font-medium text-gray-300">{label}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((listing) => (
                  <EngagementCard key={listing.engagement.id} listing={listing} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
