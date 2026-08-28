"use client";

/**
 * The express lane through the diagnosis, docked to the composer.
 *
 * These sit with the input rather than under the AI's message on purpose:
 * they're an alternative to typing, so they belong to the input apparatus,
 * not to the transcript. Stacked full-width rather than a side-by-side grid
 * so each answer reads as its own line rather than competing for a half-row
 * — the sentences vary enough in length that a two-column grid left ragged,
 * uneven cards; one per row reads evenly regardless of length.
 *
 */
export function SuggestedReplies({
  replies,
  onSelect,
}: {
  replies: string[];
  onSelect: (reply: string) => void;
}) {
  if (replies.length === 0) return null;

  return (
    <section aria-label="Quick answers" className="flex flex-col gap-2.5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500">Quick answers</p>
      <div className="flex flex-col gap-2">
        {replies.map((reply, i) => (
          <button
            key={reply}
            type="button"
            onClick={() => onSelect(reply)}
            style={{ "--chip-delay": `${i * 40}ms` } as React.CSSProperties}
            className="chip-anim-up rounded-xl border border-gray-850 bg-gray-950 px-3.5 py-2.5 text-left text-sm leading-snug text-gray-200 transition-colors duration-150 hover:border-gray-700 hover:bg-gray-900 hover:text-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-975"
          >
            {reply}
          </button>
        ))}
      </div>
    </section>
  );
}
