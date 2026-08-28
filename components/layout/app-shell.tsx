"use client";

import { Sidebar } from "./sidebar";
import { MobileDrawer } from "./mobile-drawer";
import { Topbar } from "./topbar";

export function AppShell({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    // Printing takes the document only: the shell's chrome is dropped, and
    // the viewport-height clipping that makes the app scroll is released so
    // the page can run to whatever length it needs.
    <div className="flex h-screen overflow-hidden bg-gray-975 print:block print:h-auto print:overflow-visible">
      <div className="hidden md:block print:hidden">
        <Sidebar />
      </div>
      <div className="print:hidden">
        <MobileDrawer />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="print:hidden">
          <Topbar title={title} />
        </div>
        <main className="flex-1 overflow-y-auto print:overflow-visible">{children}</main>
      </div>
    </div>
  );
}
