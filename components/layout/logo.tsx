import { LogoMark } from "@/components/icons/nav-icons";
import { cn } from "@/lib/utils/cn";

/**
 * TailoredIQ logo lockup, sourced from Figma (file dxNL7Hg5azOtuM0sGLP2ga,
 * node 107:15859): a gold badge with an inner mark, plus the wordmark next
 * to it. Badge dimensions/colors match the Figma spec exactly (32px, 7.111px
 * radius, 0.889px border, literal #dfb931/#f7cc31 gold) rather than the
 * app's --primary-500/--primary-400 tokens, which are visually close but not
 * identical.
 */
export function Logo({ collapsed, className }: { collapsed?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-[9px]", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-[7.111px] border-[0.889px] border-[#f7cc31] bg-[#dfb931]">
        <LogoMark className="h-4 w-auto text-gray-950" />
      </span>
      {!collapsed && (
        <span className="text-lg font-medium text-gray-50 whitespace-nowrap">TailoredIQ</span>
      )}
    </span>
  );
}
