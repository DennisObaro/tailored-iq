import { cn } from "@/lib/utils/cn";

/**
 * One entry in a page's declared list of sections. Pages build this array
 * once and render both the table of contents and the body from it, so the two
 * can't drift apart; `has` is the content check that decides whether the
 * section exists at all.
 */
export interface DocumentSectionSpec {
  id: string;
  label: string;
  eyebrow?: string;
  meta?: React.ReactNode;
  has: boolean;
  content: React.ReactNode;
}

/**
 * One top-level heading of a document, and the scroll target the table of
 * contents jumps to.
 *
 * The `first:` reset is what keeps the opening section flush with the header
 * above it — every other section announces itself with a hairline rule and a
 * generous run-up, which is the only separation these pages get now that the
 * card borders are gone.
 *
 * `scroll-mt` clears whichever navigation is on screen: the sticky contents
 * bar below 2xl, and just a little breathing room above it once the contents
 * move out to the left rail.
 */
export function DocumentSection({
  id,
  label,
  eyebrow,
  meta,
  children,
  className,
}: {
  id: string;
  label: string;
  /** A small ordinal or theme above the heading, e.g. "01". */
  eyebrow?: string;
  /** Right-aligned on the heading row — the playbook's "2/4 done" counter. */
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20 border-t border-gray-800 pt-10 first:border-0 first:pt-0 2xl:scroll-mt-6",
        className,
      )}
    >
      {eyebrow && (
        <p className="mb-2 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-gray-500">
          {eyebrow}
        </p>
      )}
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="font-document text-[1.375rem] font-normal leading-snug text-gray-50">{label}</h2>
        {meta && <span className="shrink-0 text-xs text-gray-500">{meta}</span>}
      </div>
      {children}
    </section>
  );
}
