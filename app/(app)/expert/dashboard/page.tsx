"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Star, Briefcase, Video, ClipboardList } from "lucide-react";
import { useSessionStore } from "@/lib/store/use-session-store";
import * as usersApi from "@/lib/api/users";
import * as opportunitiesApi from "@/lib/api/opportunities";
import * as projectsApi from "@/lib/api/projects";
import * as consultationsApi from "@/lib/api/consultations";
import type { ExpertProfile, Project, Opportunity, Consultation } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils/format";

export default function ExpertDashboardPage() {
  const user = useSessionStore((s) => s.user);
  const [profile, setProfile] = useState<ExpertProfile | null | undefined>(undefined);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [calls, setCalls] = useState<Consultation[]>([]);

  useEffect(() => {
    if (!user) return;
    usersApi.getExpertProfile(user.id).then(setProfile);
    opportunitiesApi.listOpportunities(user.id).then(setOpportunities);
    projectsApi.listProjectsForExpert(user.id).then(setProjects);
    consultationsApi.listConsultationsForExpert(user.id).then(setCalls);
  }, [user]);

  if (profile === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const isApproved = profile?.verificationStatus === "approved";

  if (!isApproved) {
    const steps = [
      { label: "Complete profile", done: !!profile?.headline },
      { label: "Verify expertise", done: (profile?.expertiseTags.length ?? 0) > 0 },
      { label: "Accept expert policies", done: !!profile?.policiesAccepted },
      { label: "Complete knowledge/ethics quiz", done: !!profile?.ethicsQuizComplete },
    ];

    return (
      <div className="mx-auto max-w-lg space-y-6 p-6 pt-16 text-center">
        <h1 className="text-xl font-semibold text-gray-50">Welcome to TailoredIQ</h1>
        <p className="text-sm text-gray-400">Your experience can help leaders make better decisions.</p>
        <Card className="p-5 text-left">
          <div className="flex flex-col gap-3">
            {steps.map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-sm">
                {s.done ? (
                  <CheckCircle2 className="size-4 text-success-400" aria-hidden />
                ) : (
                  <Circle className="size-4 text-gray-600" aria-hidden />
                )}
                <span className={s.done ? "text-gray-300 line-through" : "text-gray-200"}>{s.label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Button asChild size="lg" className="w-full justify-center">
          <Link href="/expert/onboarding">Complete my profile</Link>
        </Button>
      </div>
    );
  }

  const pendingOpportunities = opportunities.filter((o) => o.response === null);
  const upcomingCalls = calls.filter((c) => c.status === "scheduled");

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-50">Welcome back, {user?.firstName}</h1>
        <p className="mt-1 text-sm text-gray-400">Here&apos;s what&apos;s happening with your expert profile.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-gray-500">Reputation</p>
          <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-gray-50">
            <Star className="size-4 fill-primary-400 text-primary-400" aria-hidden />
            {profile.rating.toFixed(1)}
            <span className="text-sm font-normal text-gray-500">({profile.reviewCount})</span>
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Active projects</p>
          <p className="mt-1 text-lg font-semibold text-gray-50">{projects.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">New opportunities</p>
          <p className="mt-1 text-lg font-semibold text-gray-50">{pendingOpportunities.length}</p>
        </Card>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-gray-300">
            <Briefcase className="size-4" aria-hidden />
            Opportunities
          </h2>
          <Link href="/expert/opportunities" className="text-xs text-primary-400 hover:text-primary-300">
            View all
          </Link>
        </div>
        {pendingOpportunities.length === 0 ? (
          <p className="text-sm text-gray-500">No new opportunities right now.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pendingOpportunities.slice(0, 3).map((o) => (
              <Card key={o.id} className="p-4">
                <Link href={`/expert/opportunities/${o.id}`} className="text-sm font-medium text-gray-100 hover:text-primary-400">
                  {o.title}
                </Link>
                <p className="mt-1 text-xs text-gray-400">{o.relevanceReason}</p>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-gray-300">
          <Video className="size-4" aria-hidden />
          Upcoming calls
        </h2>
        {upcomingCalls.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming calls.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {upcomingCalls.map((c) => (
              <Card key={c.id} className="flex items-center justify-between p-4">
                <Link href={`/consultations/${c.id}`} className="text-sm text-gray-200 hover:text-primary-400">
                  {formatDateTime(c.scheduledFor)}
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-gray-300">
          <ClipboardList className="size-4" aria-hidden />
          Active projects
        </h2>
        {projects.length === 0 ? (
          <p className="text-sm text-gray-500">No active projects yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.map((p) => (
              <Card key={p.id} className="p-4">
                <Link href={`/expert/projects/${p.id}`} className="text-sm font-medium text-gray-100 hover:text-primary-400">
                  {p.title}
                </Link>
                <p className="mt-1 line-clamp-2 text-xs text-gray-400">{p.challenge}</p>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Profile performance</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-6 text-sm text-gray-300">
          <div>
            <p className="text-xs text-gray-500">Total projects</p>
            <p className="mt-0.5 font-medium text-gray-50">{profile.totalProjects}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Expert level</p>
            <p className="mt-0.5 font-medium capitalize text-gray-50">{profile.expertLevel}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
