import { LogoMark } from "@/components/icons/nav-icons";
import { cn } from "@/lib/utils/cn";

/**
 * TailoredIQ logo lockup, sourced from Figma (file QmKaB3nn1udOAZvu5JAgOE,
 * frame 747:518): a gold badge with an inner mark, plus the wordmark next
 * to it. The badge uses our own --primary-500/--primary-400 tokens rather
 * than Figma's literal hex (#dfb931/#f7cc31 — effectively the same gold,
 * remapped to the design system).
 */
export function Logo({ collapsed, className }: { collapsed?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-[9px]", className)}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary-400 bg-primary-500">
        <LogoMark className="h-[19px] w-auto text-gray-950" />
      </span>
      {!collapsed && (
        <span className="text-lg font-medium text-gray-50 whitespace-nowrap">TailoredIQ</span>
      )}
    </span>
  );
}
