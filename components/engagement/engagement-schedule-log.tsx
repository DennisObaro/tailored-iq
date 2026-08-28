"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Video } from "@/components/icons";
import type { Consultation } from "@/lib/types";
import * as consultationsApi from "@/lib/api/consultations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCallWhen } from "@/lib/utils/format";

export function EngagementScheduleLog({
  engagementId,
  viewerId,
}: {
  engagementId: string;
  viewerId: string;
}) {
  const [consultations, setConsultations] = useState<Consultation[] | undefined>(undefined);

  const load = useCallback(async () => {
    const result = await consultationsApi.listConsultationsForEngagement(engagementId, viewerId);
    setConsultations(result);
  }, [engagementId, viewerId]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const result = await consultationsApi.listConsultationsForEngagement(engagementId, viewerId);
      if (cancelled) return;
      setConsultations(result);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [engagementId, viewerId]);

  if (!consultations || consultations.length === 0) return null;

  const handleCompleteSession = async (consultationId: string) => {
    await consultationsApi.completeOnSiteSession(consultationId);
    await load();
  };

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-medium uppercase tracking-wide text-gray-500">Schedule</h2>
      {consultations.map((c) => (
        <Card key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-2.5">
            {c.mode === "virtual" ? (
              <Video className="size-4 text-gray-500" aria-hidden />
            ) : (
              <MapPin className="size-4 text-gray-500" aria-hidden />
            )}
            <div>
              <p className="text-sm text-gray-100">{c.mode === "virtual" ? "Virtual call" : "On-site session"}</p>
              <p className="text-xs text-gray-500">{formatCallWhen(c.scheduledFor)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={c.status} />
            {c.mode === "on_site" && c.status === "scheduled" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCompleteSession(c.id)}
              >
                Mark session complete
              </Button>
            )}
            {c.mode === "virtual" && c.status !== "completed" && c.status !== "cancelled" && (
              <Button asChild size="sm" variant="outline">
                <Link href={`/consultations/${c.id}`}>Open</Link>
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
