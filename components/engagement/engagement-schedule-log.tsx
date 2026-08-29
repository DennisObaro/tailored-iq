"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FileText, MapPin, Video } from "@/components/icons";
import type { Consultation } from "@/lib/types";
import * as consultationsApi from "@/lib/api/consultations";
import { ConsultationSummary } from "@/components/consultation/consultation-summary";
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
  /**
   * Which completed call's transcript is expanded, if any — one at a time,
   * rendered right in this card rather than by sending the client to the
   * shared /consultations page. That page is breadcrumbed under
   * Conversations; a project's call record belongs to the project.
   */
  const [openTranscriptId, setOpenTranscriptId] = useState<string | null>(null);

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
      {consultations.map((c) => {
        const transcriptOpen = openTranscriptId === c.id;
        return (
          <Card key={c.id} className="flex flex-col gap-3 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {c.mode === "virtual" ? (
                  <Video className="size-4 text-gray-500" aria-hidden />
                ) : (
                  <MapPin className="size-4 text-gray-500" aria-hidden />
                )}
                <div>
                  <p className="text-sm text-gray-100">
                    {c.mode === "virtual" ? "Virtual call" : "On-site session"}
                  </p>
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
                {/* The consultation detail page has nothing a client can act on
                    before the call — the room itself, /call, is the destination
                    that already works this way from the conversation panel
                    (components/consultation/consultation-summary.tsx). Mirrored
                    here rather than shared, since this card lives in the project
                    schedule, not a conversation thread. */}
                {c.mode === "virtual" && c.status === "scheduled" && (
                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <Link href={`/consultations/${c.id}/call`}>
                      <Video className="size-3.5" aria-hidden />
                      Join call
                    </Link>
                  </Button>
                )}
                {c.mode === "virtual" && c.status === "in_call" && (
                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <Link href={`/consultations/${c.id}/call`}>
                      <Video className="size-3.5" aria-hidden />
                      Return to call
                    </Link>
                  </Button>
                )}
                {/* Expands in place rather than linking to /consultations/[id]:
                    that page is the shared Conversations-domain view, and a
                    project's own call record shouldn't send the client out of
                    the project to read it. */}
                {c.mode === "virtual" && c.status === "completed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    aria-expanded={transcriptOpen}
                    onClick={() => setOpenTranscriptId(transcriptOpen ? null : c.id)}
                  >
                    <FileText className="size-3.5" aria-hidden />
                    {transcriptOpen ? "Hide transcript" : "View transcript"}
                  </Button>
                )}
              </div>
            </div>
            {transcriptOpen && (
              <ConsultationSummary consultationId={c.id} variant="panel" className="border-t border-gray-800 pt-3" />
            )}
          </Card>
        );
      })}
    </div>
  );
}
