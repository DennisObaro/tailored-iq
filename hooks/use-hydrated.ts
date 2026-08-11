import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/** True only after client-side mount, so persisted-store reads don't mismatch SSR output. */
export function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
