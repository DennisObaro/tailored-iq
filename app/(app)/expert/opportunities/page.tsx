"use client";

import { useEffect, useState } from "react";
import { Briefcase } from "@/components/icons";
import type { ExpertProfile } from "@/lib/types";
import * as opportunitiesApi from "@/lib/api/opportunities";
import * as expertApi from "@/lib/api/expert-onboarding";
import { useSessionStore } from "@/lib/store/use-session-store";
import { OpportunityCard } from "@/components/opportunity/opportunity-card";
import { ExpertGate, ExpertAccessBanner } from "@/components/expert/expert-gate";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { key: "new", label: "New" },
  { key: "accepted", label: "Accepted" },
  { key: "declined", label: "Declined" },
] as const;

export default function ExpertOpportunitiesPage() {
  const user = useSessionStore((s) => s.user);
  const [reload, setReload] = useState(0);
  const refetch = () => setReload((n) => n + 1);
  const [profile, setProfile] = useState<ExpertProfile | null | undefined>(undefined);
  const [listings, setListings] = useState<opportunitiesApi.OpportunityListing[] | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("new");
  const [error, setError] = useState(false);

  async function load() {
    if (!user) return;
    try {
      const [p, list] = await Promise.all([
        expertApi.getExpertProfile(user.id),
        opportunitiesApi.listOpportunities(user.id),
      ]);
      setError(false);
      setProfile(p);
      setListings(list);
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

  const filtered = (listings ?? []).filter((l) =>
    tab === "new"
      ? l.opportunity.response === null
      : tab === "accepted"
        ? l.opportunity.response === "interested"
        : l.opportunity.response === "not_for_me",
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-50">Opportunities</h1>
        <p className="mt-1 text-sm text-gray-400">
          Client challenges matched to your experience. You decide how — or whether — you help.
        </p>
      </div>

      <ExpertAccessBanner profile={profile ?? null} />

      <ExpertGate profile={profile ?? null} requires="browse">
        <div className="flex gap-1 border-b border-gray-800">
          {TABS.map((t) => {
            const count = (listings ?? []).filter((l) =>
              t.key === "new"
                ? l.opportunity.response === null
                : t.key === "accepted"
                  ? l.opportunity.response === "interested"
                  : l.opportunity.response === "not_for_me",
            ).length;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                aria-current={tab === t.key ? "page" : undefined}
                className={cn(
                  "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
                  tab === t.key
                    ? "border-primary-500 text-gray-50"
                    : "border-transparent text-gray-500 hover:text-gray-300",
                )}
              >
                {t.label} {count > 0 && <span className="text-xs text-gray-500">({count})</span>}
              </button>
            );
          })}
        </div>

        {error ? (
          <ErrorState
            whatHappened="We couldn't load your opportunities."
            dataSafe="Nothing has been lost, and no responses were changed."
            onRetry={refetch}
          />
        ) : !listings ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={tab === "new" ? "No new opportunities." : `Nothing ${tab === "accepted" ? "accepted" : "declined"} yet.`}
            description={
              tab === "new"
                ? "We'll notify you when a challenge matches your experience."
                : "Opportunities you respond to show up here."
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((listing) => (
              <OpportunityCard key={listing.opportunity.id} listing={listing} />
            ))}
          </div>
        )}
      </ExpertGate>
    </div>
  );
}
