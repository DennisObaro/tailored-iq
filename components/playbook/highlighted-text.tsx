"use client";

import type { PlaybookComment } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

export interface TextAnchor {
  comment: PlaybookComment;
  start: number;
  end: number;
}

/**
 * A block's text with its commented passages marked.
 *
 * The wash is deliberately quieter than it wants to be: `::selection` is
 * already solid gold app-wide (globals.css), so a saturated highlight would
 * be indistinguishable from the text the reader is selecting right now. A
 * tint plus an underline reads as "someone said something here" without
 * competing.
 *
 * Overlaps are resolved by taking the first anchor that opens — two comments
 * on overlapping passages is rare, and one highlight winning is better than
 * nested spans whose boundaries nobody can see anyway.
 */
export function HighlightedText({
  text,
  anchors,
  focusedCommentId,
  onFocusComment,
}: {
  text: string;
  anchors: TextAnchor[];
  focusedCommentId?: string | null;
  onFocusComment?: (commentId: string) => void;
}) {
  if (anchors.length === 0) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const anchor of anchors) {
    if (anchor.start < cursor) continue;
    if (anchor.start > cursor) parts.push(text.slice(cursor, anchor.start));

    const focused = anchor.comment.id === focusedCommentId;
    const resolved = anchor.comment.status !== "open";
    parts.push(
      <mark
        key={anchor.comment.id}
        data-comment-id={anchor.comment.id}
        onClick={() => onFocusComment?.(anchor.comment.id)}
        className={cn(
          "cursor-pointer rounded-[2px] bg-transparent transition-colors",
          focused
            ? "bg-primary-500/25 text-gray-50"
            : resolved
              ? "border-b border-gray-700 text-gray-300"
              : "border-b border-gold/40 bg-primary-500/15 text-gray-200 hover:bg-primary-500/25",
        )}
      >
        {text.slice(anchor.start, anchor.end)}
      </mark>,
    );
    cursor = anchor.end;
  }

  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}
