"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Tracks which of `ids` is the section currently being read, for a table of
 * contents to highlight.
 *
 * The root matters here. Neither the window nor `<html>` scrolls in the
 * authenticated app — AppShell's `<main>` scrolls, and the document pages nest
 * a second scroller inside it. An IntersectionObserver left on its default
 * (viewport) root would never fire against that, so the caller passes the ref
 * of the element that actually scrolls.
 *
 * The bottom `rootMargin` shrinks the observed band to the top third of the
 * scroller, so a heading becomes "active" as it reaches the top rather than
 * the moment it appears from below. Nothing intersects once the last section
 * has scrolled past that band, so the previous id is held rather than cleared
 * — the highlight should never blank out at the end of a document.
 *
 * Unlike hooks/use-in-view-once.ts this observer stays connected for the life
 * of the page: it has to keep reporting as the reader scrolls back up.
 */
export function useActiveHeading(
  ids: string[],
  rootRef: RefObject<HTMLElement | null>,
): string | null {
  const [activeId, setActiveId] = useState<string | null>(ids[0] ?? null);

  // The array identity changes on every render; its contents are what matter.
  const key = ids.join("|");

  useEffect(() => {
    const root = rootRef.current;
    const sectionIds = key ? key.split("|") : [];
    if (!root || sectionIds.length === 0) return;

    const elements = sectionIds
      .map((id) => root.querySelector<HTMLElement>(`#${CSS.escape(id)}`))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    /*
      The short sections at the end of a document can all fit on screen at
      once, so the band-based rule would leave an earlier heading highlighted
      while the reader is plainly looking at the last one. Once the scroller
      bottoms out, the last section is the answer regardless of the band.
    */
    const atBottom = () => root.scrollHeight - root.scrollTop - root.clientHeight < 2;
    const lastId = elements[elements.length - 1].id;

    const observer = new IntersectionObserver(
      (entries) => {
        if (atBottom()) {
          setActiveId(lastId);
          return;
        }
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        // Topmost wins, so overlapping sections resolve to the one being read.
        const topmost = visible.reduce((a, b) =>
          a.boundingClientRect.top <= b.boundingClientRect.top ? a : b,
        );
        setActiveId(topmost.target.id);
      },
      { root, rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));

    // Reaching the bottom doesn't necessarily cross an observer threshold, so
    // the end of the document needs watching directly as well.
    const onScroll = () => {
      if (atBottom()) setActiveId(lastId);
    };
    root.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      root.removeEventListener("scroll", onScroll);
    };
  }, [key, rootRef]);

  return activeId;
}
