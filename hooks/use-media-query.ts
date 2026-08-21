"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribes to a CSS media query from JS, for behaviour that CSS alone
 * can't gate — a pointer-driven animation, say, which has to actually stop
 * running rather than just stop being visible.
 *
 * Reads `false` on the server and during the first client render, so the
 * narrow/no-capability branch is what hydrates and the richer one is opted
 * into after mount. Anything gated on this must therefore be an enhancement
 * over a layout that already works without it.
 *
 * Same useSyncExternalStore shape as use-hydrated.ts / use-reduced-motion.ts,
 * which is also what keeps the React Compiler's set-state-in-effect rule
 * satisfied.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
