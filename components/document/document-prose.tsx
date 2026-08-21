import { cn } from "@/lib/utils/cn";

/**
 * The text primitives a document page is built from. Between them they replace
 * every `Card` + `list-disc` + `Badge` pairing these pages used to render: the
 * point is that nothing here draws a container, so the whole document sits
 * directly on the page background and is held together by type and whitespace
 * instead of by borders.
 */

/** The opening paragraph of a document — set a notch larger than body copy. */
export function DocumentLead({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-base leading-8 text-gray-200", className)}>{children}</p>;
}

/** Ordinary body copy. */
export function DocumentProse({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-[0.9375rem] leading-7 text-gray-300", className)}>{children}</p>;
}

/** A bulleted list, with its own marker rather than `list-disc`'s. */
export function DocumentList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item, i) => (
        <li
          key={i}
          className="relative pl-5 text-[0.9375rem] leading-7 text-gray-300 before:absolute before:left-0 before:top-[0.8125rem] before:size-1 before:rounded-full before:bg-gray-600"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * A numbered list with the numeral in a hanging gutter, set in the document
 * serif — the "1. From Logic to Prompting" shape a printed strategy document
 * uses for its handful of headline moves.
 */
export function DocumentNumberedList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ol className={cn("space-y-5", className)}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-4">
          <span aria-hidden className="font-document text-lg leading-7 tabular-nums text-gray-500">
            {i + 1}.
          </span>
          <span className="text-[0.9375rem] leading-7 text-gray-300">{item}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Short reference entries — frameworks, resources — as hairline-separated
 * rows. These were `Badge` pills, which are containers by another name.
 */
export function DocumentTermList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("divide-y divide-gray-800", className)}>
      {items.map((item) => (
        <li key={item} className="py-3 text-[0.9375rem] leading-6 text-gray-300 first:pt-0 last:pb-0">
          {item}
        </li>
      ))}
    </ul>
  );
}
