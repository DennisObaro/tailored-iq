"use client";

import { Bookmark, BookmarkFilled } from "@/components/icons";
import { cn } from "@/lib/utils/cn";

/**
 * The save/unsave affordance for an expert.
 *
 * Deliberately controlled — it renders `saved` and reports intent, holding no
 * state of its own. The same expert can be on screen twice at once (a card in
 * the grid and the row it links to), so the truth has to live above this in
 * the page that knows the client's whole saved set.
 *
 * `icon` is the compact form for a card corner; `labelled` is the standalone
 * button on a profile, where there's nothing else to explain what it does.
 */
export function SaveExpertButton({
  saved,
  onToggle,
  name,
  variant = "icon",
  className,
}: {
  saved: boolean;
  onToggle: (next: boolean) => void;
  /** The expert's name, so the accessible label says who is being saved. */
  name: string;
  variant?: "icon" | "labelled";
  className?: string;
}) {
  const Icon = saved ? BookmarkFilled : Bookmark;
  const label = saved ? `Remove ${name} from saved experts` : `Save ${name} to your experts`;

  return (
    <button
      type="button"
      // Cards wrap the whole tile in a Link; without both of these, saving
      // would navigate to the profile instead of staying put.
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle(!saved);
      }}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[10px] border transition-colors",
        variant === "icon" ? "size-8" : "h-8 px-3 text-xs font-medium",
        // The filled gold bookmark carries the saved state on its own; giving
        // the button a tinted fill as well would shout louder than the
        // primary action sitting next to it.
        saved
          ? "border-gray-800 bg-gray-900 text-gold hover:bg-gray-800"
          : "border-gray-800 text-gray-400 hover:bg-gray-900 hover:text-gray-100",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
      {variant === "labelled" && (saved ? "Saved" : "Save expert")}
    </button>
  );
}
