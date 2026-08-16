"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import type { ExpertProfile } from "@/lib/types";
import { getExpertAccess, missingSteps } from "@/lib/utils/expert-access";
import { ONBOARDING_STEPS } from "@/lib/constants/expert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

/**
 * The one place an expert page says "you can't do this yet". Takes the
 * capability the page needs rather than a status, so pages never
 * re-implement the rules in lib/utils/expert-access.ts.
 */
export function ExpertGate({
  profile,
  requires,
  children,
}: {
  profile: ExpertProfile | null;
  requires: "browse" | "accept" | "clientDetail" | "calls" | "knowledge";
  children: React.ReactNode;
}) {
  const access = getExpertAccess(profile);
  const allowed = {
    browse: access.canBrowseOpportunities,
    accept: access.canAcceptWork,
    clientDetail: access.canViewClientDetail,
    calls: access.canJoinCalls,
    knowledge: access.canContributeKnowledge,
  }[requires];

  if (allowed) return <>{children}</>;

  const outstanding = missingSteps(profile);

  return (
    <Card className="flex flex-col items-center gap-4 px-6 py-10 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-gray-850 text-gray-400">
        <Lock className="size-5" aria-hidden />
      </div>
      <div className="flex max-w-md flex-col gap-1.5">
        <div className="flex justify-center">
          <StatusBadge status={profile?.verificationStatus ?? "incomplete"} />
        </div>
        <p className="text-sm font-semibold text-gray-50">{access.reason}</p>
        {outstanding.length > 0 && access.level !== "pending" && (
          <p className="text-sm text-gray-400">
            Still to do:{" "}
            {outstanding
              .map((step) => ONBOARDING_STEPS.find((s) => s.key === step)?.label.toLowerCase() ?? step)
              .join(", ")}
            .
          </p>
        )}
      </div>
      {access.actionHref && (
        <Button asChild size="sm">
          <Link href={access.actionHref}>{access.actionLabel}</Link>
        </Button>
      )}
    </Card>
  );
}

/** Compact inline version for dashboards, where the page still has other content. */
export function ExpertAccessBanner({ profile }: { profile: ExpertProfile | null }) {
  const access = getExpertAccess(profile);
  if (!access.reason) return null;

  return (
    <Card className="flex flex-col gap-3 border-primary-500/30 bg-primary-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <Lock className="mt-0.5 size-4 shrink-0 text-primary-400" aria-hidden />
        <p className="text-sm text-gray-200">{access.reason}</p>
      </div>
      {access.actionHref && (
        <Button asChild size="sm" className="shrink-0 self-start sm:self-auto">
          <Link href={access.actionHref}>{access.actionLabel}</Link>
        </Button>
      )}
    </Card>
  );
}
