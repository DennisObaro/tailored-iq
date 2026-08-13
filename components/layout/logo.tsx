import { LogoMark } from "@/components/icons/nav-icons";
import { cn } from "@/lib/utils/cn";

/**
 * TailoredIQ logo lockup, sourced from Figma (file dxNL7Hg5azOtuM0sGLP2ga,
 * node 107:15859): a gold badge with an inner mark, plus the wordmark next
 * to it. Badge colors are the literal Figma gold (#dfb931/#f7cc31) rather
 * than the app's --primary-500/--primary-400 tokens, which are visually
 * close but not identical. Sized down from the Figma spec's 32px badge to
 * 28px (all proportions — radius, border, icon height — scaled with it) to
 * sit better next to the sidebar's 16px nav icons.
 */
export function Logo({ collapsed, className }: { collapsed?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] border-[0.778px] border-[#f7cc31] bg-[#dfb931]">
        <LogoMark className="h-3.5 w-auto text-gray-950" />
      </span>
      {!collapsed && (
        <span className="text-base font-medium text-gray-50 whitespace-nowrap">TailoredIQ</span>
      )}
    </span>
  );
}
