"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { getNavItems, SETTINGS_NAV } from "@/lib/constants/nav";
import { useSessionStore } from "@/lib/store/use-session-store";
import { useUiStore } from "@/lib/store/use-ui-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { Avatar } from "@/components/ui/avatar";
import { NavIcon } from "@/components/ui/nav-icon";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Logo } from "./logo";
import { RecentChats } from "./recent-chats";
import { SidebarToggleIcon } from "@/components/icons/nav-icons";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { RoleSwitcher } from "./role-switcher";
import { cn } from "@/lib/utils/cn";

export function Sidebar({ className, forceExpanded }: { className?: string; forceExpanded?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const signOut = useSessionStore((s) => s.signOut);
  const hydrated = useHydrated();
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useUiStore((s) => s.setSidebarCollapsed);

  const collapsed = !forceExpanded && hydrated && sidebarCollapsed;

  const [showLabels, setShowLabels] = useState(!collapsed);
  const [prevCollapsed, setPrevCollapsed] = useState(collapsed);
  if (prevCollapsed !== collapsed) {
    setPrevCollapsed(collapsed);
    if (collapsed) setShowLabels(false);
  }
  useEffect(() => {
    if (collapsed || showLabels) return;
    const timer = setTimeout(() => setShowLabels(true), 200);
    return () => clearTimeout(timer);
  }, [collapsed, showLabels]);

  if (!user) return null;
  const navItems = getNavItems(user.activeRole);

  async function onSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-gray-800 bg-gray-950 transition-[width] duration-200",
        collapsed ? "w-18" : "w-65",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-[85px] shrink-0 items-start px-5 pt-5",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {showLabels && (
          <Link href={user.activeRole === "expert" ? "/expert/dashboard" : "/dashboard"}>
            <Logo />
          </Link>
        )}
        {!forceExpanded && (
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex size-8 shrink-0 items-center justify-center rounded-[10px] text-gray-400 hover:bg-gray-900 hover:text-gray-100"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <SidebarToggleIcon className="size-4" aria-hidden />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-[10px] overflow-y-auto px-5 pb-2">
        <div className="flex flex-col gap-[4px]">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const link = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex h-8 items-center rounded-[10px] text-sm transition-colors duration-[180ms] ease-out",
                  collapsed ? "p-2" : "gap-[8px] pl-3",
                  active
                    ? "bg-gray-900 text-gray-50"
                    : "text-[#949494] hover:bg-gray-900 hover:text-gray-100 focus-visible:bg-gray-900 focus-visible:text-gray-100",
                )}
                aria-current={active ? "page" : undefined}
              >
                <NavIcon
                  icon={item.icon}
                  active={active}
                  className="size-4 shrink-0 transition-transform duration-[180ms] ease-out motion-safe:group-hover:-translate-y-[1px] motion-safe:group-hover:scale-[1.08] motion-safe:group-focus-visible:-translate-y-[1px] motion-safe:group-focus-visible:scale-[1.08]"
                />
                {showLabels && item.label}
              </Link>
            );

            if (!collapsed) return link;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {showLabels && user.activeRole !== "expert" && <RecentChats />}
      </div>

      <div className="flex flex-col gap-2 border-t border-gray-800 px-5 py-4">
        <RoleSwitcher collapsed={collapsed} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-[6px] rounded-[10px] py-1 text-left hover:bg-gray-900">
              <Avatar firstName={user.firstName} lastName={user.lastName} size="lg" />
              {showLabels && (
                <>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-gray-50">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="truncate text-xs capitalize text-gray-500">{user.activeRole}</span>
                  </div>
                  <ChevronDown className="size-4 shrink-0 text-gray-500" aria-hidden />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href={SETTINGS_NAV.href} className="w-full">
                <Settings className="size-4" aria-hidden />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onSignOut}>
              <LogOut className="size-4" aria-hidden />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
