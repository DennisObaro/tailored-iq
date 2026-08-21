/**
 * Turns a section heading into an anchor id. Headings on these pages come from
 * fixture and generated content, so this has to survive punctuation ("Risks &
 * considerations") and produce something `CSS.escape`-free and readable in the
 * address bar.
 */
export function slugify(heading: string): string {
  return (
    heading
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}
