"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/lib/store/use-session-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const { status, user, init } = useSessionStore();

  useEffect(() => {
    if (hydrated) init();
  }, [hydrated, init]);

  useEffect(() => {
    if (status !== "ready") return;
    if (!user) {
      router.replace("/sign-in");
    } else if (!user.onboardingComplete) {
      router.replace("/onboarding/profile");
    }
  }, [status, user, router]);

  if (!hydrated || status !== "ready" || !user || !user.onboardingComplete) {
    return (
      <div className="flex h-screen bg-gray-975">
        <div className="hidden w-60 shrink-0 border-r border-gray-800 p-4 md:block">
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
