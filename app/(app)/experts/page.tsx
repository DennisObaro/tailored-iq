"use client";

import { useEffect, useState } from "react";
import { Search, Sparkles, Users } from "lucide-react";
import * as expertsApi from "@/lib/api/experts";
import type { ExpertListing, RecommendedExpertsResult } from "@/lib/api/experts";
import { ExpertCard } from "@/components/expert/expert-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES } from "@/lib/constants/categories";
import { useSessionStore } from "@/lib/store/use-session-store";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { key: "recommended", label: "Recommended" },
  { key: "all", label: "All experts" },
] as const;

export default function ExpertsPage() {
  const user = useSessionStore((s) => s.user);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("recommended");
  const [listings, setListings] = useState<ExpertListing[] | null>(null);
  const [recommended, setRecommended] = useState<RecommendedExpertsResult | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    expertsApi.listExperts({ search: search || undefined, category: category || undefined }).then(setListings);
  }, [search, category]);

  useEffect(() => {
    if (!user) return;
    expertsApi.getRecommendedExperts(user.id).then(setRecommended);
  }, [user]);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-50">Find the right experience for your challenge.</h1>
        <p className="mt-1 text-sm text-gray-400">
          Connect with experienced founders, executives and operators who&apos;ve solved challenges like yours.
        </p>
      </div>

      <div className="mb-6 inline-flex rounded-lg border border-gray-800 bg-gray-950 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
              tab === t.key ? "bg-gray-900 text-gray-50" : "text-gray-400 hover:text-gray-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "recommended" ? (
        recommended === null ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : recommended.recommendations.length > 0 ? (
          <div>
            <p className="mb-3 text-xs text-gray-400">
              {recommended.hasChats
                ? "Based on the challenges you've recently explored."
                : "Based on your profile. Start a challenge for more tailored matches."}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {recommended.recommendations.map((r) => (
                <ExpertCard key={r.listing.user.id} listing={r.listing} reason={r.reason} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Sparkles}
            title={recommended.hasChats ? "No recommendations yet." : "Start a challenge to get recommendations."}
            description={
              recommended.hasChats
                ? "We don't have enough signal from your recent challenges yet."
                : "Once you describe a challenge, we'll recommend experts who've solved something similar."
            }
            action={
              <Button size="sm" variant="outline" onClick={() => setTab("all")}>
                Browse all experts
              </Button>
            }
          />
        )
      ) : (
        <>
          <div className="mb-6 flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-gray-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search experts..."
                className="pl-8"
              />
            </div>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-48">
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>

          {!listings ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : listings.length === 0 ? (
            <EmptyState icon={Users} title="No experts match your filters." description="Try a different search or category." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {listings.map((l) => (
                <ExpertCard key={l.user.id} listing={l} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
