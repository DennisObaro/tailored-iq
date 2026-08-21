"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveBriefNotification } from "@/lib/api/live-briefs";
import * as liveBriefsApi from "@/lib/api/live-briefs";
import { subscribeToDataChanges } from "@/lib/api/realtime";
import { useNotificationsStore } from "@/lib/store/use-notifications-store";

/**
 * The live briefs currently waiting at the top of an expert's dashboard.
 *
 * Three things can change what's showing, so all three are wired up: a write
 * anywhere in the app (this tab or another), the passing of the five-minute
 * window, and the expert's own accept/decline/dismiss. Nothing here polls
 * the data — the tick is only a clock, and it re-reads rather than re-fetches
 * when there's nothing left to expire.
 */
export function useLiveBriefs(expertId: string | undefined) {
  const [briefs, setBriefs] = useState<LiveBriefNotification[]>([]);
  const loadNotifications = useNotificationsStore((s) => s.load);
  /** Guards against a change-feed burst turning into a stampede of reads. */
  const pendingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!expertId || pendingRef.current) return;
    pendingRef.current = true;
    try {
      setBriefs(await liveBriefsApi.listLiveBriefsForExpert(expertId));
    } finally {
      pendingRef.current = false;
    }
  }, [expertId]);

  useEffect(() => {
    if (!expertId) return;
    let cancelled = false;

    const sync = () => {
      if (!cancelled) {
        refresh();
        // The bell badge is fed by the same write, so it moves in step.
        loadNotifications(expertId);
      }
    };

    sync();
    const unsubscribe = subscribeToDataChanges(sync);

    /**
     * Expiry is the one state change nothing writes — the clock just runs
     * out. A slow tick drops anything past its window without asking the
     * data layer whether something happened.
     */
    const tick = setInterval(() => {
      if (cancelled) return;
      const now = Date.now();
      setBriefs((current) =>
        current.some((b) => new Date(b.expiresAt).getTime() <= now)
          ? current.filter((b) => new Date(b.expiresAt).getTime() > now)
          : current,
      );
    }, 1000);

    return () => {
      cancelled = true;
      unsubscribe();
      clearInterval(tick);
    };
  }, [expertId, refresh, loadNotifications]);

  return { briefs, refresh };
}
