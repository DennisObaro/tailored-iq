import type { ExpertPointsSource, ExpertPointsTransaction, ExpertProfile } from "@/lib/types";
import { simulateNetwork } from "./client";
import { db, type Database } from "./_db";
import { id } from "@/lib/utils/id";
import { POINT_VALUES, levelForPoints, nextLevel } from "@/lib/constants/expert";

/**
 * Records one contribution event and re-derives the expert's standing from
 * the ledger. Point values come from configuration (POINT_VALUES) but the
 * value applied is written into the transaction, so re-tuning the config
 * later never rewrites what someone already earned.
 *
 * Internal: called from other lib/api modules inside an existing
 * db.update(), so it takes the live database rather than opening its own.
 */
export function awardPointsWithin(
  d: Database,
  input: { expertId: string; source: ExpertPointsSource; note: string; contributionId?: string },
): ExpertPointsTransaction | null {
  const profile = d.expertProfiles.find((p) => p.userId === input.expertId);
  if (!profile) return null;

  const transaction: ExpertPointsTransaction = {
    id: id("points"),
    expertId: input.expertId,
    source: input.source,
    points: POINT_VALUES[input.source],
    note: input.note,
    contributionId: input.contributionId,
    createdAt: new Date().toISOString(),
  };
  d.expertPointsTransactions.unshift(transaction);

  profile.points = d.expertPointsTransactions
    .filter((t) => t.expertId === input.expertId)
    .reduce((sum, t) => sum + t.points, 0);
  profile.expertLevel = levelForPoints(profile.points).key;

  return transaction;
}

export async function awardPoints(input: {
  expertId: string;
  source: ExpertPointsSource;
  note: string;
  contributionId?: string;
}): Promise<ExpertPointsTransaction | null> {
  return simulateNetwork(() => db.update((d) => awardPointsWithin(d, input)), { latency: [120, 250] });
}

export async function listPointsTransactions(expertId: string): Promise<ExpertPointsTransaction[]> {
  return simulateNetwork(
    () =>
      db
        .get()
        .expertPointsTransactions.filter((t) => t.expertId === expertId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    { latency: [120, 250] },
  );
}

export interface ExpertStanding {
  points: number;
  level: ReturnType<typeof levelForPoints>;
  next: ReturnType<typeof nextLevel>;
  pointsToNext: number | null;
  /** 0-1 progress through the current level. */
  progress: number;
  /** Points earned per source, most valuable first. */
  breakdown: { source: ExpertPointsSource; points: number; count: number }[];
  contributionCount: number;
  peerReviewCount: number;
  rating: number;
  reviewCount: number;
}

export async function getExpertStanding(expertId: string): Promise<ExpertStanding | null> {
  return simulateNetwork(
    () => {
      const database = db.get();
      const profile: ExpertProfile | undefined = database.expertProfiles.find((p) => p.userId === expertId);
      if (!profile) return null;

      const transactions = database.expertPointsTransactions.filter((t) => t.expertId === expertId);
      const points = transactions.reduce((sum, t) => sum + t.points, 0);
      const level = levelForPoints(points);
      const next = nextLevel(points);

      const bySource = new Map<ExpertPointsSource, { points: number; count: number }>();
      for (const t of transactions) {
        const entry = bySource.get(t.source) ?? { points: 0, count: 0 };
        entry.points += t.points;
        entry.count += 1;
        bySource.set(t.source, entry);
      }

      return {
        points,
        level,
        next,
        pointsToNext: next ? next.minPoints - points : null,
        progress: next ? (points - level.minPoints) / (next.minPoints - level.minPoints) : 1,
        breakdown: [...bySource.entries()]
          .map(([source, v]) => ({ source, ...v }))
          .sort((a, b) => b.points - a.points),
        contributionCount: database.contributions.filter((c) => c.expertId === expertId).length,
        peerReviewCount: database.expertPeerReviews.filter((r) => r.reviewerId === expertId).length,
        rating: profile.rating,
        reviewCount: profile.reviewCount,
      };
    },
    { latency: [150, 300] },
  );
}
