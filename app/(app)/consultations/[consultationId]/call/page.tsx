"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Consultation, User } from "@/lib/types";
import * as consultationsApi from "@/lib/api/consultations";
import * as usersApi from "@/lib/api/users";
import { useSessionStore } from "@/lib/store/use-session-store";
import { CallStage, CallTile } from "@/components/call/call-stage";
import { CallControls } from "@/components/call/call-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";

const AUTO_END_SECONDS = 16;

export default function CallPage() {
  const { consultationId } = useParams<{ consultationId: string }>();
  const router = useRouter();
  const currentUser = useSessionStore((s) => s.user);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [expert, setExpert] = useState<User | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState(false);
  const endRequestedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const c = await consultationsApi.getConsultation(consultationId, currentUser?.id);
      if (!c || cancelled) return;
      setConsultation(c);
      const e = await usersApi.getUser(c.expertId);
      if (!cancelled) setExpert(e);
      await consultationsApi.startCall(c.id);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [consultationId, currentUser?.id]);

  useEffect(() => {
    if (!consultation) return;
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [consultation]);

  const endCall = useRef(async () => {
    if (endRequestedRef.current) return;
    endRequestedRef.current = true;
    setEnding(true);
    try {
      await consultationsApi.endCall(consultationId);
      router.push(`/consultations/${consultationId}`);
    } catch {
      setError(true);
      setEnding(false);
    }
  });

  useEffect(() => {
    if (elapsed >= AUTO_END_SECONDS) endCall.current();
  }, [elapsed]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <ErrorState
          whatHappened="We couldn't end the call cleanly."
          dataSafe="Nothing you discussed was lost."
          onRetry={() => {
            setError(false);
            endRequestedRef.current = false;
          }}
        />
      </div>
    );
  }

  if (!consultation || !expert) {
    return (
      <div className="flex h-full flex-col gap-4 p-6">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <CallStage>
        <CallTile firstName={expert.firstName} lastName={expert.lastName} speaking={elapsed % 6 < 3} />
        <CallTile
          firstName={currentUser?.firstName ?? "You"}
          lastName={currentUser?.lastName ?? ""}
          speaking={elapsed % 6 >= 3}
        />
      </CallStage>
      <CallControls elapsedSeconds={elapsed} onEndCall={() => endCall.current()} />
      {ending && (
        <p className="pb-4 text-center text-xs text-gray-500" role="status">
          Ending call and preparing your transcript...
        </p>
      )}
    </div>
  );
}
