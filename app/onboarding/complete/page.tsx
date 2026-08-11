"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/lib/store/use-session-store";

export default function OnboardingCompletePage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const refresh = useSessionStore((s) => s.refresh);
  const [submitting, setSubmitting] = useState(false);

  async function finish() {
    if (!user) return;
    setSubmitting(true);
    const { completeOnboarding } = await import("@/lib/api/users");
    await completeOnboarding(user.id);
    await refresh();
    router.push(user.activeRole === "expert" ? "/expert/dashboard" : "/dashboard");
  }

  return (
    <div className="flex flex-col items-center gap-6 pt-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary-500/15 text-primary-400">
        <CheckCircle2 className="size-6" aria-hidden />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold text-gray-50">You&apos;re all set, {user?.firstName}</h1>
        <p className="max-w-sm text-sm text-gray-400">
          Bring us the challenge. We&apos;ll help you understand it, find relevant experience, and
          turn it into a practical path forward.
        </p>
      </div>
      <Button size="lg" loading={submitting} onClick={finish}>
        Go to dashboard
      </Button>
    </div>
  );
}
