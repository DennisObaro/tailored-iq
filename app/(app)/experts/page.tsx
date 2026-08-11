"use client";

import { useEffect, useState } from "react";
import { Search, Users } from "lucide-react";
import * as expertsApi from "@/lib/api/experts";
import type { ExpertListing } from "@/lib/api/experts";
import { ExpertCard } from "@/components/expert/expert-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES } from "@/lib/constants/categories";

export default function ExpertsPage() {
  const [listings, setListings] = useState<ExpertListing[] | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    expertsApi.listExperts({ search: search || undefined, category: category || undefined }).then(setListings);
  }, [search, category]);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-50">Experts</h1>
      </div>

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
    </div>
  );
}
