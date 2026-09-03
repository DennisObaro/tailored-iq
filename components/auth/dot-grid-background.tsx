import { cn } from "@/lib/utils/cn";

/**
 * Static dot-grid ambience for the sign-up right panel — a single tiled CSS
 * background, no DOM nodes per dot. Rendering goes through the shared
 * `.dot-grid-bg` tile in globals.css (same 16px pitch / 2px dot this component
 * used to inline), which is what makes the dots flip with the theme — the old
 * hardcoded white tile was invisible on the light theme's off-white panel.
 */
export function DotGridBackground({ className }: { className?: string }) {
  return <div className={cn("dot-grid-bg", className)} aria-hidden />;
}
