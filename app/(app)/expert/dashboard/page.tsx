"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Award, Briefcase, ClipboardList, PenLine, Star, Users, Video } from "lucide-react";
import type { Consultation, ExpertContribution, ExpertProfile, Project } from "@/lib/types";
import * as expertApi from "@/lib/api/expert-onboarding";
import * as opportunitiesApi from "@/lib/api/opportunities";
import * as projectsApi from "@/lib/api/projects";
import * as consultationsApi from "@/lib/api/consultations";
import * as contributionsApi from "@/lib/api/contributions";
import * as pointsApi from "@/lib/api/expert-points";
import { useSessionStore } from "@/lib/store/use-session-store";
import { getExpertAccess, missingSteps } from "@/lib/utils/expert-access";
import { ONBOARDING_STEPS, levelLabel } from "@/lib/constants/expert";
import { OnboardingProgress } from "@/components/expert/onboarding-progress";
import { ExpertAccessBanner } from "@/components/expert/expert-gate";
import { OpportunityCard } from "@/components/opportunity/opportunity-card";
import { ContributionCard } from "@/components/expert/contribution-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCallWhen } from "@/lib/utils/format";

function SectionHeader({
  icon: Icon,
  title,
  href,
  linkLabel = "View all",
}: {
  icon: typeof Briefcase;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-1.5 text-sm font-medium text-gray-300">
        <Icon className="size-4" aria-hidden />
        {title}
      </h2>
      {href && (
        <Link href={href} className="text-xs text-primary-400 hover:text-primary-300">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export default function ExpertDashboardPage() {
  const user = useSessionStore((s) => s.user);
  const [profile, setProfile] = useState<ExpertProfile | null | undefined>(undefined);
  const [opportunities, setOpportunities] = useState<opportunitiesApi.OpportunityListing[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [calls, setCalls] = useState<Consultation[]>([]);
  const [contributions, setContributions] = useState<ExpertContribution[]>([]);
  const [standing, setStanding] = useState<pointsApi.ExpertStanding | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const p = await expertApi.getExpertProfile(user.id);
      if (cancelled) return;
      setProfile(p);
      if (!p) return;

      const [opps, projectList, callList, contributionList, expertStanding] = await Promise.all([
        opportunitiesApi.listOpportunities(user.id),
        projectsApi.listProjectsForExpert(user.id),
        consultationsApi.listConsultationsForExpert(user.id),
        contributionsApi.listContributionsByExpert(user.id),
        pointsApi.getExpertStanding(user.id),
      ]);
      if (cancelled) return;
      setOpportunities(opps);
      setProjects(projectList);
      setCalls(callList);
      setContributions(contributionList);
      setStanding(expertStanding);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (profile === undefined || !user) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const access = getExpertAccess(profile);

  /* ------------------------------------------------ first-time / unapproved */

  if (!profile || access.level !== "approved") {
    const outstanding = missingSteps(profile);
    const nextStep = outstanding[0];

    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-50">Welcome to TailoredIQ, {user.firstName}</h1>
          <p className="mt-1.5 text-sm text-gray-400">Your experience can help leaders make better decisions.</p>
        </div>

        <ExpertAccessBanner profile={profile} />

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-100">Expert onboarding</p>
            <StatusBadge status={profile?.verificationStatus ?? "incomplete"} />
          </div>
          <OnboardingProgress profile={profile} current={nextStep} />
          {nextStep && (
            <Button asChild size="lg" className="mt-4 w-full justify-center gap-2">
              <Link href="/expert/onboarding">
                Continue: {ONBOARDING_STEPS.find((s) => s.key === nextStep)?.label}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          )}
        </Card>

        {access.canContributeKnowledge && (
          <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-100">You can still contribute knowledge</p>
              <p className="mt-0.5 text-xs text-gray-400">
                Insights and case studies go through peer review — they don&apos;t need client access.
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0">
              <Link href="/expert/contributions">Contribute</Link>
            </Button>
          </Card>
        )}
      </div>
    );
  }

  /* ------------------------------------------------------ approved / returning */

  const newOpportunities = opportunities.filter((o) => o.opportunity.response === null);
  const activeProjects = projects.filter((p) => p.status !== "completed" && p.status !== "archived");
  const upcomingCalls = calls.filter((c) => c.status === "scheduled");
  const recentContributions = contributions.slice(0, 3);
  const inReview = contributions.filter((c) => c.status === "submitted" || c.status === "under_review").length;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 p-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-50">Welcome back, {user.firstName}</h1>
        <p className="mt-1 text-sm text-gray-400">
          {newOpportunities.length > 0
            ? `${newOpportunities.length} challenge${newOpportunities.length === 1 ? "" : "s"} could use your experience.`
            : "No new opportunities right now — here's where your work stands."}
        </p>
      </div>

      <section>
        <SectionHeader icon={Briefcase} title="New opportunities" href="/expert/opportunities" />
        {newOpportunities.length === 0 ? (
          <Card className="p-4">
            <p className="text-sm text-gray-400">
              Nothing new. We&apos;ll notify you when a challenge matches your experience.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {newOpportunities.slice(0, 3).map((listing) => (
              <OpportunityCard key={listing.opportunity.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader icon={ClipboardList} title="Your active projects" href="/expert/projects" />
        {activeProjects.length === 0 ? (
          <Card className="p-4">
            <p className="text-sm text-gray-400">Nothing in flight. Accept an opportunity to start a project.</p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeProjects.slice(0, 4).map((p) => (
              <Link key={p.id} href={`/expert/projects/${p.id}`}>
                <Card className="p-4 transition-colors hover:bg-gray-850">
                  <StatusBadge status={p.status} />
                  <p className="mt-2 text-sm font-medium text-gray-100">{p.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-400">{p.challenge}</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader icon={Video} title="Upcoming calls" href="/expert/calls" />
        {upcomingCalls.length === 0 ? (
          <Card className="p-4">
            <p className="text-sm text-gray-400">No calls scheduled.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {upcomingCalls.slice(0, 3).map((c) => {
              const project = projects.find((p) => p.id === c.projectId);
              return (
                <Card key={c.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div>
                    <p className="text-sm text-gray-100">{project?.title ?? "Client consultation"}</p>
                    <p className="text-xs text-gray-500">{formatCallWhen(c.scheduledFor)}</p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/consultations/${c.id}`}>Open</Link>
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionHeader icon={PenLine} title="Your contributions" href="/expert/contributions" />
        {recentContributions.length === 0 ? (
          <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-400">
              You haven&apos;t contributed to the knowledge base yet — an insight is the quickest place to start.
            </p>
            <Button asChild size="sm" className="shrink-0">
              <Link href="/expert/contributions/new">Write an insight</Link>
            </Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {inReview > 0 && (
              <p className="text-xs text-gray-500">
                {inReview} awaiting peer review.
              </p>
            )}
            {recentContributions.map((c) => (
              <ContributionCard key={c.id} contribution={c} href={`/expert/contributions/${c.id}`} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader icon={Award} title="Your standing" href="/expert/rewards" linkLabel="View rewards" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs text-gray-500">Level</p>
            <p className="mt-1 text-lg font-semibold text-gray-50">{levelLabel(profile.expertLevel)}</p>
            {standing?.next && (
              <p className="mt-0.5 text-xs text-gray-500">
                {standing.pointsToNext} points to {standing.next.label}
              </p>
            )}
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500">Contribution points</p>
            <p className="mt-1 text-lg font-semibold text-gray-50">{standing?.points ?? profile.points}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500">Client feedback</p>
            {profile.reviewCount > 0 ? (
              <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-gray-50">
                <Star className="size-4 fill-primary-400 text-primary-400" aria-hidden />
                {profile.rating.toFixed(1)}
                <span className="text-sm font-normal text-gray-500">({profile.reviewCount})</span>
              </p>
            ) : (
              <p className="mt-1 text-lg font-semibold text-gray-50">New</p>
            )}
          </Card>
        </div>
      </section>

      <section>
        <SectionHeader icon={Users} title="Ways to contribute" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <Badge variant="outline">Peer review</Badge>
            <p className="mt-2 text-sm text-gray-300">Review another expert&apos;s contribution before it&apos;s published.</p>
            <Button asChild size="sm" variant="ghost" className="mt-2 px-0">
              <Link href="/expert/contributions?tab=review">Open the queue</Link>
            </Button>
          </Card>
          <Card className="p-4">
            <Badge variant="outline">Calls for insight</Badge>
            <p className="mt-2 text-sm text-gray-300">Answer an open question the network is asking right now.</p>
            <Button asChild size="sm" variant="ghost" className="mt-2 px-0">
              <Link href="/expert/contributions?tab=calls">See open calls</Link>
            </Button>
          </Card>
          <Card className="p-4">
            <Badge variant="outline">Refer an expert</Badge>
            <p className="mt-2 text-sm text-gray-300">Invite someone whose experience the network is missing.</p>
            <Button asChild size="sm" variant="ghost" className="mt-2 px-0">
              <Link href="/expert/rewards#referrals">Issue a code</Link>
            </Button>
          </Card>
        </div>
      </section>
    </div>
  );
}
