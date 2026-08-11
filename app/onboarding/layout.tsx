"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSessionStore } from "@/lib/store/use-session-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { Skeleton } from "@/components/ui/skeleton";

const STEPS = [
  { path: "/onboarding/profile", label: "Profile" },
  { path: "/onboarding/complete", label: "Done" },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const { status, user, init } = useSessionStore();

  useEffect(() => {
    if (hydrated) init();
  }, [hydrated, init]);

  useEffect(() => {
    if (status === "ready" && !user) router.replace("/sign-in");
  }, [status, user, router]);

  if (!hydrated || status !== "ready" || !user) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const activeIndex = STEPS.findIndex((s) => pathname.startsWith(s.path));

  return (
    <div className="flex min-h-screen flex-col bg-gray-975">
      <header className="mx-auto flex w-full max-w-lg items-center gap-2 px-4 py-8">
        {STEPS.map((step, i) => (
          <div key={step.path} className="flex flex-1 items-center gap-2">
            <div
              className={`h-1 flex-1 rounded-full ${i <= activeIndex ? "bg-primary-500" : "bg-gray-800"}`}
            />
          </div>
        ))}
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-16">{children}</main>
    </div>
  );
}
