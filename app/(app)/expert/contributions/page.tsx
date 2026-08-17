"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PenLine, MessagesSquare, Megaphone, Plus } from "@/components/icons";
import type { ExpertContribution, ExpertProfile } from "@/lib/types";
import * as contributionsApi from "@/lib/api/contributions";
import * as expertApi from "@/lib/api/expert-onboarding";
import { useSessionStore } from "@/lib/store/use-session-store";
import { ExpertGate, ExpertAccessBanner } from "@/components/expert/expert-gate";
import { ContributionCard } from "@/components/expert/contribution-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { key: "mine", label: "Your contributions" },
  { key: "review", label: "Peer review" },
  { key: "calls", label: "Calls for insight" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function ContributionsHub() {
  const searchParams = useSearchParams();
  const user = useSessionStore((s) => s.user);
  const [reload, setReload] = useState(0);
  const refetch = () => setReload((n) => n + 1);

  const initialTab = (searchParams.get("tab") as TabKey | null) ?? "mine";
  const [tab, setTab] = useState<TabKey>(TABS.some((t) => t.key === initialTab) ? initialTab : "mine");

  const [profile, setProfile] = useState<ExpertProfile | null | undefined>(undefined);
  const [mine, setMine] = useState<ExpertContribution[] | null>(null);
  const [queue, setQueue] = useState<contributionsApi.ContributionListing[] | null>(null);
  const [calls, setCalls] = useState<Awaited<ReturnType<typeof contributionsApi.listCallsForInsight>> | null>(null);
  const [error, setError] = useState(false);

  async function load() {
    if (!user) return;
    try {
      const [p, mineList, queueList, callList] = await Promise.all([
        expertApi.getExpertProfile(user.id),
        contributionsApi.listContributionsByExpert(user.id),
        contributionsApi.listPeerReviewQueue(user.id),
        contributionsApi.listCallsForInsight(),
      ]);
      setError(false);
      setProfile(p);
      setMine(mineList);
      setQueue(queueList);
      setCalls(callList);
    } catch {
      setError(true);
      setProfile(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, reload]);

  const counts: Record<TabKey, number> = {
    mine: mine?.length ?? 0,
    review: queue?.length ?? 0,
    calls: calls?.length ?? 0,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-50">Contributions</h1>
          <p className="mt-1 text-sm text-gray-400">
            Everything you add to the knowledge network — and everything waiting on your judgement.
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/expert/contributions/new">
            <Plus className="size-4" aria-hidden />
            New contribution
          </Link>
        </Button>
      </div>

      <ExpertAccessBanner profile={profile ?? null} />

      <ExpertGate profile={profile ?? null} requires="knowledge">
        <div className="flex gap-1 border-b border-gray-800">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-current={tab === t.key ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
                tab === t.key ? "border-primary-500 text-gray-50" : "border-transparent text-gray-500 hover:text-gray-300",
              )}
            >
              {t.label} {counts[t.key] > 0 && <span className="text-xs text-gray-500">({counts[t.key]})</span>}
            </button>
          ))}
        </div>

        {error ? (
          <ErrorState
            whatHappened="We couldn't load your contributions."
            dataSafe="Nothing has been lost — no drafts were affected."
            onRetry={refetch}
          />
        ) : !mine || !queue || !calls ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : tab === "mine" ? (
          mine.length === 0 ? (
            <EmptyState
              icon={PenLine}
              title="You haven't contributed yet."
              description="Write up something you've learned — it goes through peer review before it's published."
              action={
                <Button asChild size="sm">
                  <Link href="/expert/contributions/new">Write an insight</Link>
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {mine.map((c) => (
                <ContributionCard key={c.id} contribution={c} href={`/expert/contributions/${c.id}`} />
              ))}
            </div>
          )
        ) : tab === "review" ? (
          queue.length === 0 ? (
            <EmptyState
              icon={MessagesSquare}
              title="Nothing waiting on you."
              description="When another expert submits a contribution, it shows up here for review."
            />
          ) : (
            <>
              <p className="text-xs text-gray-500">
                Nothing is published to the network until an expert who wasn&apos;t involved says it holds up.
              </p>
              <div className="flex flex-col gap-3">
                {queue.map(({ contribution, author }) => (
                  <ContributionCard
                    key={contribution.id}
                    contribution={contribution}
                    author={author}
                    href={`/expert/contributions/${contribution.id}`}
                  />
                ))}
              </div>
            </>
          )
        ) : calls.length === 0 ? (
          <EmptyState icon={Megaphone} title="No open calls right now." description="We'll post new questions here." />
        ) : (
          <div className="flex flex-col gap-3">
            {calls.map((call) => (
              <Card key={call.id} className="flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{call.category}</Badge>
                  <span className="text-xs text-gray-500">Closes {formatDate(call.closesAt)}</span>
                </div>
                <p className="text-sm font-medium text-gray-50">{call.title}</p>
                <p className="text-sm text-gray-400">{call.prompt}</p>
                <Button asChild size="sm" variant="outline" className="self-start">
                  <Link href={`/expert/contributions/new?callId=${call.id}&type=insight`}>Respond</Link>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </ExpertGate>
    </div>
  );
}

export default function ExpertContributionsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl p-6"><Skeleton className="h-40 w-full" /></div>}>
      <ContributionsHub />
    </Suspense>
  );
}
