"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

export interface BlockSelection {
  blockId: string;
  start: number;
  end: number;
  quote: string;
  /** Viewport rect of the selection, for placing the comment bubble. */
  rect: { top: number; left: number; width: number };
}

/**
 * How many characters of a block's text precede `node`, walking the block in
 * document order. `Range.startOffset` is relative to whichever text node the
 * selection began in, and a highlighted block is several text nodes — so the
 * offsets that get stored have to be measured against the block's whole
 * string, which is what the anchor resolver later searches.
 */
function offsetWithin(block: HTMLElement, node: Node, offsetInNode: number): number {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  let total = 0;
  let current = walker.nextNode();
  while (current) {
    if (current === node) return total + offsetInNode;
    total += current.textContent?.length ?? 0;
    current = walker.nextNode();
  }
  return total;
}

/**
 * The passage the reader has selected, as an anchor into one block.
 *
 * Returns null for a selection that spans two blocks. Comments anchor inside a
 * single block because that's the unit the Scribe edits — a range straddling a
 * block boundary would be broken by the first edit to either side of it, and
 * refusing is more honest than storing something that can't survive.
 */
export function useTextSelection(
  containerRef: RefObject<HTMLElement | null>,
  { enabled = true }: { enabled?: boolean } = {},
): { selection: BlockSelection | null; clear: () => void } {
  const [selection, setSelection] = useState<BlockSelection | null>(null);

  const clear = useCallback(() => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  useEffect(() => {
    /* Not subscribing is the whole disable — the value is gated on the way
       out, so nothing has to be cleared here. */
    if (!enabled) return;

    function read() {
      const container = containerRef.current;
      const native = window.getSelection();
      if (!container || !native || native.isCollapsed || native.rangeCount === 0) {
        setSelection(null);
        return;
      }

      const range = native.getRangeAt(0);
      const quote = range.toString().trim();
      if (!quote) {
        setSelection(null);
        return;
      }

      const blockOf = (node: Node) =>
        (node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement)?.closest<HTMLElement>(
          "[data-block-id]",
        ) ?? null;

      const startBlock = blockOf(range.startContainer);
      const endBlock = blockOf(range.endContainer);
      // One block, inside this document, or it isn't an anchor.
      if (!startBlock || startBlock !== endBlock || !container.contains(startBlock)) {
        setSelection(null);
        return;
      }
      const blockId = startBlock.dataset.blockId;
      if (!blockId) {
        setSelection(null);
        return;
      }

      const rawStart = offsetWithin(startBlock, range.startContainer, range.startOffset);
      const rawEnd = offsetWithin(startBlock, range.endContainer, range.endOffset);
      const [from, to] = rawStart <= rawEnd ? [rawStart, rawEnd] : [rawEnd, rawStart];

      /**
       * `toString()` is trimmed above but the range isn't, so re-find the
       * trimmed quote inside the raw span — otherwise a selection that caught
       * a trailing space stores offsets that don't match what it quotes, and
       * the anchor resolves as "moved" on its very first render.
       */
      const raw = startBlock.textContent ?? "";
      const drift = raw.slice(from, to).indexOf(quote);
      const start = drift === -1 ? from : from + drift;

      const rect = range.getBoundingClientRect();
      setSelection({
        blockId,
        start,
        end: start + quote.length,
        quote,
        rect: { top: rect.top, left: rect.left, width: rect.width },
      });
    }

    document.addEventListener("selectionchange", read);
    return () => document.removeEventListener("selectionchange", read);
  }, [containerRef, enabled]);

  return { selection: enabled ? selection : null, clear };
}
