"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Persists a value a short while after the user stops changing it, and
 * immediately when they leave the field.
 *
 * Typing can't wait on a round trip, and this prototype's write path is
 * expensive in a way a real one isn't: every db.update persists the whole
 * database and wakes every subscriber, so a save per keystroke would have the
 * document re-rendering under the cursor. Waiting for a pause collapses a
 * sentence into one write.
 *
 * `flush` is what blur calls — leaving a field is a stronger signal of "done"
 * than any timer, and waiting out the delay after it would be a window where
 * the work looks saved and isn't.
 */
export function useAutosave<T>(
  save: (value: T) => Promise<unknown>,
  { delay = 800 }: { delay?: number } = {},
) {
  const [state, setState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<T | null>(null);
  /** Latest callback without making it a dependency of every scheduled write. */
  const saveRef = useRef(save);
  const aliveRef = useRef(true);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    aliveRef.current = true;
    const timers = timerRef;
    return () => {
      aliveRef.current = false;
      if (timers.current) clearTimeout(timers.current);
    };
  }, []);

  const run = useCallback(async () => {
    if (pendingRef.current === null) return;
    const value = pendingRef.current;
    pendingRef.current = null;
    setState("saving");
    try {
      await saveRef.current(value);
      if (!aliveRef.current) return;
      setState("saved");
      setSavedAt(new Date().toISOString());
    } catch {
      if (aliveRef.current) setState("error");
    }
  }, []);

  const schedule = useCallback(
    (value: T) => {
      pendingRef.current = value;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(run, delay);
    },
    [delay, run],
  );

  /** Write whatever is pending right now — for blur, or leaving the page. */
  const flush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    return run();
  }, [run]);

  return { state, savedAt, schedule, flush };
}
