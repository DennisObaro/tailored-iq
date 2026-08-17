import type { ComponentType, SVGProps } from "react";
import { HugeiconsIcon } from "@hugeicons/react";

/**
 * The shape every icon in the app is expected to have: a plain
 * `(props) => <svg />` component. Figma-sourced icons already are one;
 * Hugeicons needs the adapter below.
 */
export type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number }>;

/**
 * Wraps a Hugeicons icon record so it renders like any other icon
 * component — callers pass className/strokeWidth and never have to know
 * where the icon came from.
 */
export function hugeiconsAdapter(icon: Parameters<typeof HugeiconsIcon>[0]["icon"]): IconComponent {
  return function Adapter(props: SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
    return <HugeiconsIcon icon={icon} {...props} />;
  };
}
