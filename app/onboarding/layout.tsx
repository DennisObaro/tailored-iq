"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/lib/store/use-session-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { Skeleton } from "@/components/ui/skeleton";
import { TestimonialCarousel } from "@/components/auth/testimonial-carousel";
import { DotGridBackground } from "@/components/auth/dot-grid-background";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const router = useRouter();
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

  return (
    <div className="flex min-h-screen bg-gray-975">
      <div className="flex w-full flex-1 flex-col lg:w-1/2">
        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-16">{children}</main>
      </div>

      <div className="relative hidden w-1/2 overflow-hidden bg-gray-975 lg:block">
        <DotGridBackground className="absolute inset-0" />
        <div className="relative z-10 h-full">
          <TestimonialCarousel />
        </div>
      </div>
    </div>
  );
}
