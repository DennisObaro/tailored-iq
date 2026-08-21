"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fires once, the first time the referenced element scrolls into view, and
 * then disconnects — the landing page's scroll-triggered entrances are
 * one-shot reveals, so they must never replay when the user scrolls back up.
 *
 * Returns `inView: false` until that happens (including during SSR), which is
 * the pre-entrance state every consumer's CSS already styles for.
 */
export function useInViewOnce<T extends HTMLElement>({
  threshold = 0.2,
  rootMargin,
}: { threshold?: number; rootMargin?: string } = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { threshold, rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, inView };
}
