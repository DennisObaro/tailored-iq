"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Users } from "@/components/icons";
import type { ExpertContributionType } from "@/lib/types";
import * as contributionsApi from "@/lib/api/contributions";
import * as expertsApi from "@/lib/api/experts";
import { useSessionStore } from "@/lib/store/use-session-store";
import { levelLabel } from "@/lib/constants/expert";
import { ContributionCard } from "@/components/expert/contribution-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { cn } from "@/lib/utils/cn";

const FILTERS: { key: ExpertContributionType | "all"; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "insight", label: "Insights" },
  { key: "case_study", label: "Case studies" },
  { key: "thought_leadership", label: "Thought leadership" },
];

export default function ExpertInsightsPage() {
  const user = useSessionStore((s) => s.user);
  const [reload, setReload] = useState(0);
  const refetch = () => setReload((n) => n + 1);
  const [filter, setFilter] = useState<ExpertContributionType | "all">("all");
  const [knowledge, setKnowledge] = useState<contributionsApi.ContributionListing[] | null>(null);
  const [peers, setPeers] = useState<expertsApi.PeerExpertListing[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(false);

  async function load() {
    try {
      const [published, peerList] = await Promise.all([
        contributionsApi.listPublishedKnowledge(filter === "all" ? {} : { type: filter }),
        user ? expertsApi.listPeerExperts(user.id, search || undefined) : Promise.resolve([]),
      ]);
      setError(false);
      setKnowledge(published);
      setPeers(peerList);
    } catch {
      setError(true);
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
  }, [user, filter, search, reload]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-50">Insights</h1>
        <p className="mt-1 text-sm text-gray-400">
          What the network has published — every piece reviewed by an expert who wasn&apos;t involved in writing it.
        </p>
      </div>

      <section>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filter === f.key
                  ? "border-primary-500 bg-primary-500/15 text-primary-400"
                  : "border-gray-800 text-gray-400 hover:text-gray-200",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error ? (
          <ErrorState whatHappened="We couldn't load the knowledge base." dataSafe="Nothing has been lost." onRetry={refetch} />
        ) : !knowledge ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : knowledge.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Nothing published here yet."
            description="Published contributions appear once they've passed peer review."
            action={
              <Button asChild size="sm">
                <Link href="/expert/contributions/new">Write the first one</Link>
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {knowledge.map(({ contribution, author }) => (
              <ContributionCard
                key={contribution.id}
                contribution={contribution}
                author={author}
                href={`/expert/contributions/${contribution.id}`}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-gray-300">
            <Users className="size-4" aria-hidden />
            Experts in the network
          </h2>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or expertise"
            className="h-8 w-full sm:w-56"
            aria-label="Search experts"
          />
        </div>

        {!peers ? (
          <Skeleton className="h-24 w-full" />
        ) : peers.length === 0 ? (
          <Card className="p-4">
            <p className="text-sm text-gray-400">No experts match that search.</p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {peers.slice(0, 6).map(({ user: peer, profile, sharedCategories, publishedContributions }) => (
              <Card key={peer.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-center gap-2.5">
                  <Avatar firstName={peer.firstName} lastName={peer.lastName} src={peer.avatarUrl} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-50">
                      {peer.firstName} {peer.lastName}
                    </p>
                    <p className="truncate text-xs text-gray-500">{profile.headline}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">{levelLabel(profile.expertLevel)}</Badge>
                  {publishedContributions > 0 && (
                    <Badge>
                      {publishedContributions} published
                    </Badge>
                  )}
                </div>
                {sharedCategories.length > 0 && (
                  <p className="text-xs text-primary-400">
                    You both work in {sharedCategories.slice(0, 2).join(" and ").toLowerCase()}
                  </p>
                )}
                <Button asChild size="sm" variant="ghost" className="self-start px-0">
                  <Link href="/expert/contributions?tab=review">Review their work</Link>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
