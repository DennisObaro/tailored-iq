import type { EngagementListing } from "@/lib/api/engagements";

export type EngagementBucket = "in_progress" | "rating" | "completed";

export function engagementBucketOf(listing: EngagementListing): EngagementBucket {
  if (listing.engagement.status !== "completed") return "in_progress";
  return listing.myReview ? "completed" : "rating";
}

export const ENGAGEMENT_BUCKETS: [EngagementBucket, string][] = [
  ["in_progress", "In progress"],
  ["rating", "Rating"],
  ["completed", "Completed"],
];
