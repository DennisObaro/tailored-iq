import type { PlaybookBlock, PlaybookComment } from "@/lib/types";

/**
 * Where a comment's passage is in the text right now.
 *
 * `exact` — the offsets still describe the quote.
 * `moved` — the quote survived but sits somewhere else, because the Scribe
 *           edited around it. Offsets are recomputed.
 * `orphaned` — the quote is gone. Nothing is highlighted and the rail says so.
 */
export type ResolvedAnchor =
  | { state: "exact"; start: number; end: number }
  | { state: "moved"; start: number; end: number }
  | { state: "orphaned" };

/**
 * Re-locates a comment inside a block that may have been edited underneath it.
 *
 * There is no operational transform here — the Scribe edits a whole block at a
 * time and nothing rewrites the comments that point into it. So the stored
 * offsets are a hint and the quote is the real anchor: search for the text the
 * commenter actually selected, and if it has genuinely gone, say so rather
 * than highlighting whatever now occupies those character positions. A
 * confidently wrong highlight is worse than an honest "this moved on".
 */
export function resolveAnchor(text: string, comment: PlaybookComment): ResolvedAnchor {
  const { quote, startOffset, endOffset } = comment;
  if (!quote) return { state: "orphaned" };

  if (
    startOffset !== undefined &&
    endOffset !== undefined &&
    text.slice(startOffset, endOffset) === quote
  ) {
    return { state: "exact", start: startOffset, end: endOffset };
  }

  /**
   * Search from the original offset outwards rather than from zero, so a quote
   * that appears more than once in the block resolves to the occurrence
   * nearest where it used to be.
   */
  const from = Math.max(0, (startOffset ?? 0) - quote.length);
  const forward = text.indexOf(quote, from);
  const found = forward !== -1 ? forward : text.indexOf(quote);
  if (found === -1) return { state: "orphaned" };

  return { state: "moved", start: found, end: found + quote.length };
}

/**
 * The text a comment can anchor into, for each block kind — the same string
 * `data-block-id` wraps in the document, so a selection offset means the same
 * thing on both sides.
 *
 * Blocks made of several fields (a phase's steps, a table's cells) have no
 * single run of text, so they aren't anchorable; a comment on one of those
 * falls back to naming the section.
 */
export function anchorableText(block: PlaybookBlock): string | null {
  switch (block.kind) {
    case "paragraph":
    case "insight":
      return block.text;
    case "science":
      return block.text;
    default:
      return null;
  }
}

/** The comments that resolve into one block, with their positions. */
export function anchorsForBlock(
  block: PlaybookBlock,
  comments: PlaybookComment[],
): { comment: PlaybookComment; start: number; end: number }[] {
  const text = anchorableText(block);
  if (text === null) return [];

  return comments
    .filter((c) => c.blockId === block.id && c.status !== "rejected")
    .map((comment) => {
      const resolved = resolveAnchor(text, comment);
      return resolved.state === "orphaned"
        ? null
        : { comment, start: resolved.start, end: resolved.end };
    })
    .filter((x): x is { comment: PlaybookComment; start: number; end: number } => x !== null)
    /* Left to right, so the renderer can walk the string once. */
    .sort((a, b) => a.start - b.start);
}
