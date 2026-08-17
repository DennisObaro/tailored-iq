"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { IconComponent } from "@/components/icons/hugeicon";
import { cn } from "@/lib/utils/cn";

const ROTATE_MS = 10000;
/** How long after an interaction ends before rotation picks up again. */
const RESUME_MS = 2500;
/** Half of the cross-fade: old set fades up and out, new set fades in. */
const FADE_MS = 200;

export interface Suggestion {
  text: string;
  icon?: IconComponent;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Rotates whole sets of example questions inside a composer — the set is
 * the unit, so the chips always read as one coherent offer rather than
 * three independently flipping slots.
 *
 * One interval runs for the component's life and consults refs to decide
 * whether this tick should advance, so hovering, focusing or typing costs
 * no re-render and can't leave a second timer behind.
 */
export function SuggestionCarousel({
  sets,
  onSelect,
  paused = false,
  disabled = false,
  className,
}: {
  sets: Suggestion[][];
  onSelect: (suggestion: string) => void;
  /** Set while the user is busy in the input this belongs to. */
  paused?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [entered, setEntered] = useState(true);

  const pausedRef = useRef(paused);
  const resumeAtRef = useRef(0);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Hover/focus/touch on the chips themselves. */
  const setInteracting = useCallback((interacting: boolean) => {
    pausedRef.current = interacting;
    if (!interacting) resumeAtRef.current = Date.now() + RESUME_MS;
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
    if (!paused) resumeAtRef.current = Date.now() + RESUME_MS;
  }, [paused]);

  useEffect(() => {
    if (sets.length < 2) return;

    const interval = setInterval(() => {
      if (pausedRef.current || Date.now() < resumeAtRef.current) return;

      const advance = () => setIndex((i) => (i + 1) % sets.length);

      // Read at tick time rather than held in state: the preference can
      // change mid-session and nothing renders off it.
      if (prefersReducedMotion()) {
        advance();
        return;
      }

      setEntered(false);
      fadeTimeoutRef.current = setTimeout(() => {
        advance();
        setEntered(true);
      }, FADE_MS);
    }, ROTATE_MS);

    return () => {
      clearInterval(interval);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, [sets.length]);

  const current = sets[index] ?? [];

  return (
    <div
      role="group"
      aria-label="Example questions"
      className={cn(
        // One line, always: the row scrolls sideways rather than growing the
        // composer a line taller, and it fades out at the trailing edge so a
        // half-visible chip reads as "there's more" instead of as clipping.
        "flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "[mask-image:linear-gradient(to_right,black_calc(100%-56px),transparent)]",
        "transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
        entered ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
        className,
      )}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={() => setInteracting(false)}
      onTouchStart={() => setInteracting(true)}
      onTouchEnd={() => setInteracting(false)}
    >
      {current.map(({ text, icon: Icon }) => (
        <button
          key={text}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(text)}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-gray-800 px-3.5 py-2 text-sm text-gray-300",
            "hover:border-gray-700 hover:bg-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50",
          )}
        >
          {Icon && <Icon className="size-4 shrink-0 text-gray-500" strokeWidth={1.5} aria-hidden />}
          {text}
        </button>
      ))}
    </div>
  );
}
