import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";

export interface IconPair {
  stroke: IconSvgElement;
  solid: IconSvgElement;
}

interface NavIconProps {
  icon: IconPair;
  active?: boolean;
  className?: string;
}

/**
 * Reusable Hugeicons Pro stroke/solid swap: renders the stroke-rounded
 * variant by default and switches to the solid-rounded variant of the same
 * icon when `active` is true. Use for sidebar nav items, tabs, or any
 * other UI with a persistent selected/unselected state.
 *
 * Pair icons with the `as` import alias to avoid name collisions between
 * the two style packages, e.g.:
 *   import { Home01Icon as Home01Stroke } from "@hugeicons-pro/core-stroke-rounded";
 *   import { Home01Icon as Home01Solid } from "@hugeicons-pro/core-solid-rounded";
 *   const homeIcon: IconPair = { stroke: Home01Stroke, solid: Home01Solid };
 */
export function NavIcon({ icon, active, className }: NavIconProps) {
  return (
    <HugeiconsIcon
      icon={active ? icon.solid : icon.stroke}
      color="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden
    />
  );
}
