"use client";

import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils/cn";

export interface DocumentTocItem {
  id: string;
  label: string;
}

/**
 * Jumps to a section without going through a hash change.
 *
 * A native `#id` link would work against the window, but nothing on these
 * pages scrolls the window — AppShell's `<main>` and the document's own
 * scroller do. `scrollIntoView` finds the right scrolling ancestor by itself,
 * respects the target's `scroll-margin-top`, and sidesteps Next's scroll
 * restoration, which fights same-tick hash scrolls (see the double-rAF
 * workaround the landing page needs for exactly this reason).
 *
 * The `href` stays on the anchor so the link is still copyable and
 * keyboard-operable; only the default jump is replaced.
 */
function useJumpToSection() {
  const reducedMotion = useReducedMotion();

  return useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ block: "start", behavior: reducedMotion ? "auto" : "smooth" });
    },
    [reducedMotion],
  );
}

/**
 * The contents as a quiet column beside the document. Only at 2xl and up: at
 * smaller sizes the matched-experts rail already owns the horizontal room, and
 * squeezing a third column in would drop the document's measure below what's
 * comfortable to read.
 */
export function DocumentContentsRail({
  items,
  activeId,
  className,
}: {
  items: DocumentTocItem[];
  activeId: string | null;
  className?: string;
}) {
  const jumpTo = useJumpToSection();
  if (items.length === 0) return null;

  return (
    <nav aria-label="Contents" className={cn("hidden w-48 shrink-0 2xl:block", className)}>
      <div className="sticky top-0 self-start pt-1">
        <p className="mb-3 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-gray-500">
          Contents
        </p>
        <ol>
          {items.map((item) => {
            const active = item.id === activeId;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => jumpTo(e, item.id)}
                  aria-current={active ? "location" : undefined}
                  className={cn(
                    "block py-1.5 pl-3 text-[0.8125rem] leading-5 transition-colors duration-[180ms] ease-out",
                    active
                      ? "border-l-2 border-gold text-gray-50"
                      : "border-l border-gray-800 text-gray-500 hover:text-gray-300 focus-visible:text-gray-300",
                  )}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

/**
 * The same contents as a single sticky row above the document, for every width
 * below the left rail's. Sticks to the top of the document's own scroller —
 * the negative margin and the backdrop are what stop body copy showing through
 * as it passes underneath.
 */
export function DocumentContentsBar({
  items,
  activeId,
  className,
}: {
  items: DocumentTocItem[];
  activeId: string | null;
  className?: string;
}) {
  const jumpTo = useJumpToSection();
  const listRef = useRef<HTMLOListElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  /*
    Keep the highlighted entry reachable as the reader scrolls the document —
    on a phone most of this row is off-screen.

    Deliberately `scrollLeft` rather than `scrollIntoView`: the active entry
    changes *during* a smooth jump to a section, and scrollIntoView would
    cancel that animation partway, leaving the reader stranded between two
    headings. Writing scrollLeft on this list touches nothing else.
  */
  useEffect(() => {
    const list = listRef.current;
    const active = activeRef.current;
    if (!list || !active) return;
    const target = active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2;
    list.scrollLeft = Math.max(0, target);
  }, [activeId]);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Contents"
      className={cn(
        "sticky top-0 z-10 -mx-6 mt-8 border-b border-gray-800 bg-gray-975/90 px-6 backdrop-blur 2xl:hidden",
        className,
      )}
    >
      {/* no-scrollbar: the row still scrolls, but a scrollbar under a document's
          own heading list reads as a stray rule. The active entry centres
          itself, so nothing gets lost off the end. */}
      <ol ref={listRef} className="no-scrollbar flex gap-5 overflow-x-auto py-3">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id} className="shrink-0">
              <a
                ref={active ? activeRef : undefined}
                href={`#${item.id}`}
                onClick={(e) => jumpTo(e, item.id)}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "block whitespace-nowrap border-b-2 pb-0.5 text-[0.8125rem] leading-5 transition-colors duration-[180ms] ease-out",
                  active
                    ? "border-gold text-gray-50"
                    : "border-transparent text-gray-500 hover:text-gray-300 focus-visible:text-gray-300",
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
