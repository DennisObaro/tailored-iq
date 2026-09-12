import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * The small label above a section heading on the expert pages — set as quiet
 * uppercase type rather than the gold `.eyebrow` pill, so the eye goes to the
 * heading rather than to a row of badges down the page.
 *
 * Kept as one component rather than a repeated utility string: five sections
 * share it, and they have to stay identical to read as one system.
 */
export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "block text-xs font-semibold uppercase tracking-[0.22em] text-mkt-text-mute",
        className,
      )}
    >
      {children}
    </span>
  );
}
