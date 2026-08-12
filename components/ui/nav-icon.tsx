import type { ComponentType, SVGProps } from "react";

// strokeWidth narrowed to `number` (native SVGProps allows string|number) so
// this is a common shape both plain <svg> components and HugeiconsIcon
// adapters (@hugeicons/react types strokeWidth as number-only) satisfy.
type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number }>;

export interface IconPair {
  Stroke: IconComponent;
  Solid: IconComponent;
}

interface NavIconProps {
  icon: IconPair;
  active?: boolean;
  className?: string;
}

/**
 * Reusable stroke/solid swap: renders the stroke variant by default and
 * switches to the solid variant of the same icon when `active` is true.
 * Use for sidebar nav items, tabs, or any other UI with a persistent
 * selected/unselected state.
 *
 * `IconPair` is source-agnostic — an icon can come from
 * components/icons/nav-icons.tsx (Figma-sourced) or be a thin adapter
 * around @hugeicons/react's `HugeiconsIcon` (see lib/constants/nav.ts for
 * both patterns). NavIcon itself doesn't know or care which.
 */
export function NavIcon({ icon: { Stroke, Solid }, active, className }: NavIconProps) {
  const Icon = active ? Solid : Stroke;
  return <Icon className={className} strokeWidth={1.5} aria-hidden />;
}
