"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "@/components/icons";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils/cn";

/**
 * Dark/light switch. Icon only — the two icons are unambiguous and a label
 * would have to say either the current theme or the target one, which reads
 * as a bug to whichever half of users assumes the other convention.
 *
 * The two icons are stacked and cross-faded rather than swapped on a
 * conditional, so the change is one continuous motion instead of a pop. Both
 * are always mounted, which also keeps the button from resizing mid-transition.
 *
 * Until hydration the button renders inert but full-size: `theme` is unknown
 * on the server, so committing to an icon would guarantee a wrong one for half
 * of visitors, and omitting the button entirely would shift the layout around
 * it the moment it appeared.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const hydrated = useHydrated();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      // The label names what the control *does*, not what it currently shows.
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      disabled={!hydrated}
      className={cn(
        "relative grid size-9 shrink-0 place-items-center rounded-full text-gray-400",
        "transition-colors hover:bg-gray-850 hover:text-gray-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
        className,
      )}
    >
      <Sun
        aria-hidden
        className={cn(
          "col-start-1 row-start-1 size-4.5 transition-all duration-300 ease-out",
          hydrated && !isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-50 opacity-0",
        )}
      />
      <Moon
        aria-hidden
        className={cn(
          "col-start-1 row-start-1 size-4.5 transition-all duration-300 ease-out",
          hydrated && isDark
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-90 scale-50 opacity-0",
        )}
      />
    </button>
  );
}
