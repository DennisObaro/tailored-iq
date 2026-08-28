"use client";

import { useEffect, useState } from "react";

export interface Countdown {
  /** Milliseconds left; 0 once the deadline has passed. */
  remainingMs: number;
  expired: boolean;
  /** "18h 04m", or "47m" inside the last hour. */
  label: string;
  /** How close it is, for callers deciding how loudly to say so. */
  urgency: "calm" | "soon" | "critical";
}

const HOUR_MS = 3_600_000;

function describe(remainingMs: number): Countdown {
  if (remainingMs <= 0) {
    return { remainingMs: 0, expired: true, label: "0m", urgency: "critical" };
  }
  const totalMinutes = Math.floor(remainingMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return {
    remainingMs,
    expired: false,
    // Inside the last hour the hours component is just a zero taking up room,
    // and minutes are what the reader is actually counting.
    label: hours > 0 ? `${hours}h ${String(minutes).padStart(2, "0")}m` : `${minutes}m`,
    urgency: remainingMs <= HOUR_MS ? "critical" : remainingMs <= 6 * HOUR_MS ? "soon" : "calm",
  };
}

/**
 * A live countdown to an ISO timestamp.
 *
 * Ticks once a minute rather than once a second: the label's finest unit is
 * minutes, so a per-second interval would re-render sixty times to change
 * nothing. The first tick is aligned to the next minute boundary so the
 * displayed value never sits a stale minute behind the clock.
 *
 * Returns null for a missing deadline, so a caller can render nothing without
 * having to branch before calling the hook.
 */
export function useCountdown(deadline: string | undefined): Countdown | null {
  const target = deadline ? new Date(deadline).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (target === null) return;
    /*
      No synchronous seed here: `now` is wall-clock rather than anything
      derived from `target`, so the mount-time value is already correct and
      the remaining time is recomputed on every render regardless. Seeding it
      would only trigger a cascading render for no change in output.
    */
    let interval: ReturnType<typeof setInterval> | undefined;
    const align = setTimeout(
      () => {
        setNow(Date.now());
        interval = setInterval(() => setNow(Date.now()), 60_000);
      },
      60_000 - (Date.now() % 60_000),
    );

    return () => {
      clearTimeout(align);
      if (interval) clearInterval(interval);
    };
  }, [target]);

  if (target === null) return null;
  return describe(target - now);
}
