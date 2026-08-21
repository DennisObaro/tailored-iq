"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // `data-theme` rather than next-themes' default `class`, so the attribute
    // the CSS keys off is the same one the app is styled by — see the
    // [data-theme="light"] block in globals.css. defaultTheme="system" with
    // enableSystem means a first-time visitor gets prefers-color-scheme, and
    // any explicit choice is persisted to localStorage from then on.
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider delayDuration={200}>
        {children}
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
