"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * One-shot scroll entrance for marketing sections: content rises a little and
 * fades in the first time it reaches the viewport, and never replays.
 *
 * It speaks the same motion language the landing pages already use — opacity
 * plus a small translateY over 500ms, a `--panel-delay`-style stagger, and no
 * transform at all under reduced motion (see `.founder-note-panel` in
 * globals.css) — rather than introducing a second kind of reveal alongside it.
 *
 * Two details worth keeping if this is ever refactored:
 *
 * - It checks the element's own rectangle on mount as well as observing it.
 *   IntersectionObserver callbacks are throttled in background tabs, and a
 *   reveal that never fires leaves real content at `opacity: 0`. The rect
 *   check means anything already on screen shows immediately, whatever the
 *   observer is doing.
 * - `className` lands on the element itself, so a Reveal can *be* a grid or
 *   flex child instead of wrapping one in an extra div that would break the
 *   parent's layout.
 */
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
const DURATION_MS = 500;

function onScreen(el: Element) {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
}

export function Reveal({
  children,
  className,
  /** Stagger, in ms. Keep the spread across a group under ~300ms. */
  delay = 0,
  /** How far it rises. Cards and panels want more than a line of copy. */
  y = 20,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (onScreen(el)) {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    // Second rect check once layout has settled, for the case where the
    // observer is throttled and the element was already in view.
    const settle = setTimeout(() => {
      if (onScreen(el)) {
        setShown(true);
        observer.disconnect();
      }
    }, 400);
    return () => {
      observer.disconnect();
      clearTimeout(settle);
    };
  }, []);

  const visible = shown || reduced;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible || reduced ? "none" : `translateY(${y}px)`,
        transition: reduced
          ? "opacity 200ms ease-out"
          : `opacity ${DURATION_MS}ms ${EASE_OUT} ${delay}ms, transform ${DURATION_MS}ms ${EASE_OUT} ${delay}ms`,
        willChange: visible ? undefined : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
