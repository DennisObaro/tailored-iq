"use client";

import { useCallback, useEffect, useRef } from "react";
import type { IconComponent } from "@/components/icons/hugeicon";
import { cn } from "@/lib/utils/cn";

/** Pixels per second the strip drifts. Slow enough to ignore while typing. */
const SPEED_PX_PER_SEC = 32;
/**
 * Ceiling on how much time one frame is allowed to account for. The browser
 * stops firing rAF entirely while the tab is hidden, so the first frame back
 * would otherwise be handed every second the user spent elsewhere and lurch
 * the strip forward by thousands of pixels.
 */
const MAX_FRAME_SECONDS = 0.05;
/** How long after an interaction ends before the drift picks up again. */
const RESUME_MS = 2500;

export interface Suggestion {
  text: string;
  icon?: IconComponent;
}

/**
 * An endless, slowly drifting strip of example questions inside a composer.
 *
 * The chips are rendered twice and the scroll position is rebased by exactly
 * one copy whenever it crosses either edge. Both copies are identical, so the
 * rebase is invisible — that's what makes the strip endless in both
 * directions, and it means nothing ever leaves for good: a question that
 * drifts off the left can always be scrolled back to.
 *
 * Movement is real scroll position rather than a transform, so the user's own
 * wheel, trackpad or drag works with no extra handling, and it composes with
 * keyboard focus scrolling a chip into view.
 */
export function SuggestionCarousel({
  suggestions,
  onSelect,
  paused = false,
  disabled = false,
  className,
}: {
  suggestions: Suggestion[];
  onSelect: (suggestion: string) => void;
  /** Set while the user is busy in the input this belongs to. */
  paused?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const firstCopyRef = useRef<HTMLDivElement>(null);

  const pausedRef = useRef(paused);
  const resumeAtRef = useRef(0);
  const pointerDownRef = useRef(false);
  /** Width of one copy plus the seam gap — the distance a full lap covers. */
  const loopWidthRef = useRef(0);
  /** Our own fractional position; scrollLeft alone can't carry 0.5px a frame. */
  const positionRef = useRef(0);
  /** Last position we wrote, so scrolling the user did is told apart from ours. */
  const appliedRef = useRef(0);

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
    const scroller = scrollerRef.current;
    const firstCopy = firstCopyRef.current;
    if (!scroller || !firstCopy) return;

    const measure = () => {
      const gap = parseFloat(getComputedStyle(scroller).columnGap) || 0;
      loopWidthRef.current = firstCopy.offsetWidth + gap;
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(firstCopy);
    return () => observer.disconnect();
  }, [suggestions]);

  useEffect(() => {
    // Read live rather than at mount: the preference can change mid-session,
    // and a strip that keeps drifting after it's turned off is the bug.
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let lastFrameTime = 0;

    function step(now: number) {
      frame = requestAnimationFrame(step);

      const elapsed = lastFrameTime
        ? Math.min((now - lastFrameTime) / 1000, MAX_FRAME_SECONDS)
        : 0;
      lastFrameTime = now;

      const scroller = scrollerRef.current;
      const loopWidth = loopWidthRef.current;
      if (!scroller || loopWidth <= 0) return;

      // The user moved it themselves — adopt where they left it and hold off,
      // so the drift never fights a thumb mid-scroll.
      if (Math.abs(scroller.scrollLeft - appliedRef.current) > 1) {
        positionRef.current = scroller.scrollLeft;
        resumeAtRef.current = Date.now() + RESUME_MS;
      }

      const drifting =
        !pausedRef.current && !motionQuery.matches && Date.now() >= resumeAtRef.current;
      if (drifting) positionRef.current += SPEED_PX_PER_SEC * elapsed;

      // Skipped mid-drag: rebasing under an active gesture would cancel its
      // momentum. It settles the moment the finger lifts.
      if (!pointerDownRef.current) {
        if (positionRef.current >= loopWidth) positionRef.current -= loopWidth;
        else if (positionRef.current < 0) positionRef.current += loopWidth;
      }

      scroller.scrollLeft = positionRef.current;
      appliedRef.current = scroller.scrollLeft;
    }

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      ref={scrollerRef}
      role="group"
      aria-label="Example questions"
      className={cn(
        // One line, always: the row scrolls sideways rather than growing the
        // composer a line taller, and both edges fade so a half-visible chip
        // reads as "there's more this way" instead of as clipping.
        "flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "[mask-image:linear-gradient(to_right,transparent,black_32px,black_calc(100%-56px),transparent)]",
        className,
      )}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={() => setInteracting(false)}
      onTouchStart={() => setInteracting(true)}
      onTouchEnd={() => setInteracting(false)}
      onPointerDown={() => (pointerDownRef.current = true)}
      onPointerUp={() => (pointerDownRef.current = false)}
      onPointerCancel={() => (pointerDownRef.current = false)}
    >
      {/*
        Copy two exists only to fill the gap left behind as copy one drifts
        off. It's the same questions, so it's hidden from assistive tech and
        skipped by the tab order rather than read out twice.
      */}
      {[0, 1].map((copy) => (
        <div
          key={copy}
          ref={copy === 0 ? firstCopyRef : undefined}
          className="flex shrink-0 gap-2"
          aria-hidden={copy === 1 || undefined}
        >
          {suggestions.map(({ text, icon: Icon }) => (
            <button
              key={text}
              type="button"
              disabled={disabled}
              tabIndex={copy === 1 ? -1 : undefined}
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
      ))}
    </div>
  );
}
