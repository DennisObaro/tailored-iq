"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { getNavItems, SETTINGS_NAV } from "@/lib/constants/nav";
import { useSessionStore } from "@/lib/store/use-session-store";
import { Avatar } from "@/components/ui/avatar";
import { NavIcon } from "@/components/ui/nav-icon";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { RoleSwitcher } from "./role-switcher";
import { cn } from "@/lib/utils/cn";

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const signOut = useSessionStore((s) => s.signOut);

  if (!user) return null;
  const navItems = getNavItems(user.activeRole);

  async function onSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  return (
    <nav
      aria-label="Primary"
      className={cn("flex h-full w-60 shrink-0 flex-col border-r border-gray-800 bg-gray-950", className)}
    >
      <div className="flex h-14 items-center px-4">
        <Link
          href={user.activeRole === "expert" ? "/expert/dashboard" : "/dashboard"}
          className="text-sm font-semibold tracking-tight text-gray-50"
        >
          Tailored<span className="text-primary-500">IQ</span>
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-gray-900 text-gray-50"
                  : "text-gray-400 hover:bg-gray-900 hover:text-gray-100",
              )}
              aria-current={active ? "page" : undefined}
            >
              <NavIcon icon={item.icon} active={active} className={cn("size-4", active && "text-primary-400")} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 border-t border-gray-800 p-2">
        <RoleSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-gray-900">
              <Avatar firstName={user.firstName} lastName={user.lastName} size="sm" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-gray-50">
                  {user.firstName} {user.lastName}
                </span>
                <span className="truncate text-xs capitalize text-gray-500">{user.activeRole}</span>
              </div>
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
