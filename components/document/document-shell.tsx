"use client";

import { useRef } from "react";
import { useActiveHeading } from "@/hooks/use-active-heading";
import {
  DocumentContentsBar,
  DocumentContentsRail,
  type DocumentTocItem,
} from "@/components/document/document-contents";

/**
 * The page frame shared by the executive summary and the playbook: a scrolling
 * document with its contents alongside, and an optional rail on the right.
 *
 * It owns the scroll container because the table of contents needs it — the
 * scrollspy observes sections against this element, not the viewport.
 *
 * Both forms of the contents are always in the DOM and one is hidden by CSS,
 * rather than branching on a measured breakpoint: nothing here needs to know
 * the viewport width at render time, so there's no hydration mismatch to
 * manage and no layout shift on first paint.
 */
export function DocumentShell({
  contents,
  header,
  aside,
  children,
}: {
  contents: DocumentTocItem[];
  /** Title block. Sits above the sticky contents bar and outside the sections. */
  header: React.ReactNode;
  /** The matched-experts rail, placed by the caller. */
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeId = useActiveHeading(
    contents.map((c) => c.id),
    scrollRef,
  );

  return (
    <div className="flex h-full">
      <div ref={scrollRef} className="thin-scrollbar min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-5xl gap-10 px-6 py-6">
          <DocumentContentsRail items={contents} activeId={activeId} />
          <article className="min-w-0 flex-1">
            {header}
            <DocumentContentsBar items={contents} activeId={activeId} />
            {/*
              The contents bar carries the run-up below 2xl and vanishes above
              it, so the gap under the header lives here where it survives both.
            */}
            <div className="mt-10 space-y-10">{children}</div>
          </article>
        </div>
      </div>
      {aside}
    </div>
  );
}
