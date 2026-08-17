"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Bell, Menu } from "@/components/icons";
import { useSessionStore } from "@/lib/store/use-session-store";
import { useNotificationsStore } from "@/lib/store/use-notifications-store";
import { useUiStore } from "@/lib/store/use-ui-store";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelative } from "@/lib/utils/format";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";

export function Topbar({ title }: { title?: string }) {
  const user = useSessionStore((s) => s.user);
  const { items, loaded, load, markAllRead } = useNotificationsStore();
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const unreadCount = items.filter((n) => !n.read).length;

  useEffect(() => {
    if (user && !loaded) load(user.id);
  }, [user, loaded, load]);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-800 bg-gray-975 px-4">
      <div className="flex items-center gap-3">
        <button
          className="flex size-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-900 hover:text-gray-100 md:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="size-4.5" />
        </button>
        {title && <h1 className="text-sm font-medium text-gray-200">{title}</h1>}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="relative flex size-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-900 hover:text-gray-100"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex size-2 rounded-full bg-primary-500" aria-hidden />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between px-3 py-2">
            <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
            {unreadCount > 0 && user && (
              <button
                className="text-xs text-primary-400 hover:text-primary-300"
                onClick={() => markAllRead(user.id)}
              >
                Mark all read
              </button>
            )}
          </div>
          <DropdownMenuSeparator className="my-0" />
          <div className="max-h-80 overflow-y-auto p-1">
            {items.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No notifications yet"
                description="We'll let you know when there's something to see."
                className="border-none py-8"
              />
            ) : (
              items.slice(0, 8).map((n) => (
                <Link
                  key={n.id}
                  href={n.linkHref}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-sm px-2 py-2 hover:bg-gray-850",
                    !n.read && "bg-gray-900/60",
                  )}
                >
                  <span className="text-sm font-medium text-gray-100">{n.title}</span>
                  <span className="text-xs text-gray-400">{n.body}</span>
                  <span className="text-[11px] text-gray-600">{formatRelative(n.createdAt)}</span>
                </Link>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
