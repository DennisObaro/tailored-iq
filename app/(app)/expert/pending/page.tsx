"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2, Clock } from "@/components/icons";
import type { ExpertProfile } from "@/lib/types";
import * as expertApi from "@/lib/api/expert-onboarding";
import { useSessionStore } from "@/lib/store/use-session-store";
import { ExpertProfilePreview } from "@/components/expert/expert-profile-preview";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type State = "done" | "current" | "todo";

function StageRow({ label, state }: { label: string; state: State }) {
  const Icon = state === "done" ? CheckCircle2 : state === "current" ? Loader2 : Circle;
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <Icon
        className={cn(
          "size-4 shrink-0",
          state === "done" ? "text-success-400" : state === "current" ? "animate-spin text-primary-400" : "text-gray-700",
        )}
        aria-hidden
      />
      <span className={state === "todo" ? "text-gray-500" : "text-gray-200"}>{label}</span>
    </li>
  );
}

/**
 * Where an expert lands after submitting, and where they land on every
 * sign-in until a decision is made. They can see exactly where they are —
 * but nothing here grants access to client work.
 */
export default function ExpertPendingPage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const [profile, setProfile] = useState<ExpertProfile | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    expertApi.getExpertProfile(user.id).then((p) => {
      setProfile(p);
      if (p?.verificationStatus === "approved") router.replace("/expert/dashboard");
      if (!p) router.replace("/become-an-expert");
    });
  }, [user, router]);

  if (profile === undefined || !user) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!profile) return null;

  const rejected = profile.verificationStatus === "rejected" || profile.verificationStatus === "restricted";

  const stages: { label: string; state: State }[] = [
    { label: "Account created", state: "done" },
    { label: "Experience submitted", state: "done" },
    { label: "Expertise confirmed", state: "done" },
    { label: "Policies accepted", state: profile.policiesAccepted ? "done" : "todo" },
    { label: "Knowledge check completed", state: profile.ethicsQuizComplete ? "done" : "todo" },
    { label: "Profile review", state: rejected ? "done" : "current" },
    { label: "Expert access", state: "todo" },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <StatusBadge status={profile.verificationStatus} className="self-start" />
        <h1 className="text-xl font-semibold text-gray-50">
          {rejected ? "Your expert profile needs another look" : "Your expert profile is under review."}
        </h1>
        <p className="text-sm text-gray-400">
          {rejected
            ? (profile.statusReason ??
              "A reviewer couldn't verify part of your application. Update your profile and we'll take another look.")
            : "We're reviewing your professional background and expertise. You'll receive access once your profile is approved."}
        </p>
        {profile.submittedAt && !rejected && (
          <p className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="size-3.5" aria-hidden />
            Submitted {formatDateTime(profile.submittedAt)} · reviews usually take 2–3 working days
          </p>
        )}
      </div>

      <Card className="p-5">
        <ol className="flex flex-col gap-2.5">
          {stages.map((stage) => (
            <StageRow key={stage.label} label={stage.label} state={stage.state} />
          ))}
        </ol>
      </Card>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-300">
          While you wait, you can still write for the knowledge base — those contributions go through peer review, not
          client work.
        </p>
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <Link href="/expert/contributions">Contribute an insight</Link>
        </Button>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-medium text-gray-300">What we&apos;re reviewing</h2>
        <ExpertProfilePreview user={user} profile={profile} />
      </div>

      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/expert/onboarding">Edit my profile</Link>
      </Button>
    </div>
  );
}
