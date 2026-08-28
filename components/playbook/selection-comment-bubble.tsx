"use client";

import { MessageSquare } from "@/components/icons";
import type { BlockSelection } from "@/hooks/use-text-selection";

/**
 * The "comment on this" affordance, floating above a selected passage.
 *
 * Fixed-positioned from the selection's own viewport rect rather than
 * anchored to a trigger element: the thing being pointed at is a range of
 * characters, which no element wraps, and a Popover would need a fake node
 * standing in for it. Reading the rect off the live Range says exactly where
 * the words are.
 *
 * `onMouseDown` + preventDefault rather than onClick — clicking normally
 * collapses the selection before the handler runs, which would throw away the
 * very thing being commented on.
 */
export function SelectionCommentBubble({
  selection,
  onComment,
}: {
  selection: BlockSelection | null;
  onComment: (selection: BlockSelection) => void;
}) {
  if (!selection) return null;

  return (
    <div
      className="fixed z-40 -translate-x-1/2 -translate-y-full pb-2"
      style={{
        top: selection.rect.top,
        left: selection.rect.left + selection.rect.width / 2,
      }}
    >
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          onComment(selection);
        }}
        className="flex items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-gray-100 shadow-lg hover:bg-gray-850"
      >
        <MessageSquare className="size-3.5" aria-hidden />
        Comment
      </button>
    </div>
  );
}
