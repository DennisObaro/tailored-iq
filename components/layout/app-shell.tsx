"use client";

import { Sidebar } from "./sidebar";
import { MobileDrawer } from "./mobile-drawer";
import { Topbar } from "./topbar";

export function AppShell({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-975">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <MobileDrawer />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
