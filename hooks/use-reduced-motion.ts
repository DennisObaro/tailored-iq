"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Tracks the user's `prefers-reduced-motion` setting, and keeps tracking it —
 * the OS-level toggle can flip mid-session, so this subscribes rather than
 * reading the query once on mount.
 *
 * Reads `false` on the server and during the first client render (matchMedia
 * doesn't exist while server rendering), so the motion-enabled markup is what
 * hydrates; React re-renders with the real value immediately after. Every
 * consumer's reduced-motion branch is a calmer version of the same layout,
 * never a different one, so that correction can't shift the page.
 *
 * Same useSyncExternalStore shape as hooks/use-hydrated.ts, which is also
 * what keeps the React Compiler's set-state-in-effect rule satisfied.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
