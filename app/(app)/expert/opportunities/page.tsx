"use client";

import { useEffect, useState } from "react";
import { Briefcase } from "lucide-react";
import type { Opportunity } from "@/lib/types";
import * as opportunitiesApi from "@/lib/api/opportunities";
import { useSessionStore } from "@/lib/store/use-session-store";
import { OpportunityCard } from "@/components/opportunity/opportunity-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExpertOpportunitiesPage() {
  const user = useSessionStore((s) => s.user);
  const [opportunities, setOpportunities] = useState<Opportunity[] | null>(null);

  useEffect(() => {
    if (!user) return;
    opportunitiesApi.listOpportunities(user.id).then(setOpportunities);
  }, [user]);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-50">Opportunities</h1>

      {!opportunities ? (
        <Skeleton className="h-32 w-full" />
      ) : opportunities.length === 0 ? (
        <EmptyState icon={Briefcase} title="No opportunities yet." description="We'll notify you when a matching challenge comes in." />
      ) : (
        <div className="flex flex-col gap-3">
          {opportunities.map((o) => (
            <OpportunityCard key={o.id} opportunity={o} />
          ))}
        </div>
      )}
    </div>
  );
}
