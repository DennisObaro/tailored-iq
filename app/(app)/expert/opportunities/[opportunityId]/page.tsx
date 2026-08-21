"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  ArrowRight,
  Check,
  Lock,
  Phone,
  BookOpen,
  Briefcase,
  ClipboardList,
  type IconComponent,
} from "@/components/icons";
import type { ExpertProfile, ExpertWillingness, Project } from "@/lib/types";
import * as opportunitiesApi from "@/lib/api/opportunities";
import * as projectsApi from "@/lib/api/projects";
import * as expertApi from "@/lib/api/expert-onboarding";
import { useSessionStore } from "@/lib/store/use-session-store";
import { ENGAGEMENT_MODES, WILLINGNESS_LABELS } from "@/lib/constants/expert";
import { DIAGNOSTIC_QUESTIONS } from "@/lib/ai-sim/chat-responder";
import { getExpertAccess } from "@/lib/utils/expert-access";
import { ExpertAccessBanner } from "@/components/expert/expert-gate";
import { OptionCard } from "@/components/expert/onboarding/step-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorState } from "@/components/ui/error-state";
import { FieldError } from "@/components/ui/input";

const MODE_ICONS: Partial<Record<ExpertWillingness, IconComponent>> = {
  advisory_call: Phone,
  playbook_contribution: BookOpen,
  consulting_engagement: Briefcase,
};

export default function OpportunityDetailPage() {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const user = useSessionStore((s) => s.user);

  const [listing, setListing] = useState<opportunitiesApi.OpportunityListing | null | undefined>(undefined);
  const [project, setProject] = useState<Project | null>(null);
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [offered, setOffered] = useState<ExpertWillingness[]>([]);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await opportunitiesApi.getOpportunity(opportunityId);
      if (cancelled) return;
      setListing(result);
      if (!result) return;

      // Opening it is what moves the opportunity out of "new".
      if (!result.opportunity.viewedAt) await opportunitiesApi.markOpportunityViewed(opportunityId);
      if (user) {
        const p = await expertApi.getExpertProfile(user.id);
        if (!cancelled) {
          setProfile(p);
          /**
           * Only a response already given comes back pre-selected. What the
           * expert is generally willing to do decides which options appear,
           * not which are ticked — this question is what they'll take on
           * *here*, and pre-ticking it answers it for them.
           */
          setOffered(result.opportunity.offeredContributions);
        }
      }
      if (result.canViewClientDetail) {
        const proj = await projectsApi.getProject(result.opportunity.projectId);
        if (!cancelled) setProject(proj);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [opportunityId, user]);

  async function respond(response: "interested" | "not_for_me") {
    if (!listing) return;
    setResponding(true);
    setError(null);
    try {
      const updated = await opportunitiesApi.respondToOpportunity(listing.opportunity.id, response, offered);
      setListing(updated);
      /**
       * Deliberately stays put. This used to bounce to the project after
       * 700ms, which read as "you've been given the work" — the expert has
       * expressed interest, and the client still chooses. The confirmation
       * below says so and offers the project as a link instead.
       *
       * Expressing interest is also what unlocks the client's detail, so the
       * challenge card fills in without needing a reload.
       */
      if (updated.canViewClientDetail) {
        setProject(await projectsApi.getProject(updated.opportunity.projectId, user?.id));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't record your response.");
    } finally {
      setResponding(false);
    }
  }

  if (listing === undefined) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <ErrorState
          whatHappened="We couldn't find this opportunity."
          dataSafe="Nothing has been lost."
          nextStep="It may have been filled or withdrawn. Check your other opportunities."
        />
      </div>
    );
  }

  const { opportunity, stage } = listing;
  const access = getExpertAccess(profile);
  const isIntake = opportunity.kind === "direct_intake";
  const requested = opportunity.requestedContributions
    .map((c) => WILLINGNESS_LABELS[c]?.toLowerCase())
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <div className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/expert/opportunities" className="hover:text-gray-300">
            Opportunities
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span className="text-gray-300">{opportunity.title}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{opportunity.category}</Badge>
          <StatusBadge status={stage} />
        </div>
        <h1 className="mt-2 text-xl font-semibold text-gray-50">{opportunity.title}</h1>
        <p className="mt-2 text-sm text-gray-300">{opportunity.summary}</p>
      </div>

      <ExpertAccessBanner profile={profile} />

      <Card>
        <CardHeader>
          <CardTitle>Why you&apos;re relevant</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-300">{opportunity.relevanceReason}</p>
        </CardContent>
      </Card>

      {/*
        Direct intake replaces the whole engagement question: the client
        picked this expert themselves and hasn't defined their challenge yet,
        so there is nothing to opt into — only a conversation to run.
      */}
      {isIntake && (
        <Card>
          <CardHeader>
            <CardTitle>Client intake</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-gray-300">
              This client booked a call directly and needs help defining their challenge. On the call you&apos;ll
              guide them through the questions below and complete their brief on their behalf.
            </p>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Questions TailoredIQ has prepared
              </p>
              <ol className="flex flex-col gap-2">
                {DIAGNOSTIC_QUESTIONS.map((q, i) => (
                  <li key={q} className="flex gap-2.5 text-sm text-gray-400">
                    <span className="shrink-0 tabular-nums text-gray-600">{i + 1}.</span>
                    {q}
                  </li>
                ))}
              </ol>
            </div>
            <Button asChild size="sm" className="gap-1.5 self-start">
              <Link href={`/expert/opportunities/${opportunity.id}/intake`}>
                <ClipboardList className="size-4" aria-hidden />
                Open the intake
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>The challenge</CardTitle>
        </CardHeader>
        <CardContent>
          {listing.canViewClientDetail && project ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-300">{project.challenge}</p>
              <Button asChild size="sm" variant="outline" className="self-start">
                <Link href={`/expert/projects/${project.id}`}>Open the full project</Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-start gap-2.5">
              <Lock className="mt-0.5 size-4 shrink-0 text-gray-500" aria-hidden />
              <p className="text-sm text-gray-400">
                What you can see above is enough to judge whether this is yours to help with. The client&apos;s brief,
                executive summary and any transcripts stay private until you express interest — and only for as long
                as you&apos;re engaged on the project.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {isIntake ? null : opportunity.response === "interested" ? (
        <Card className="flex flex-col gap-4 p-4">
          <div>
            <p className="text-sm font-medium text-gray-50">You&apos;re in.</p>
            <p className="mt-1 text-sm text-gray-400">
              Your interest has been recorded. We&apos;ll let you know when the next step is ready.
            </p>
          </div>

          {opportunity.offeredContributions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Your interests</p>
              <ul className="flex flex-col gap-1.5">
                {opportunity.offeredContributions.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="size-3.5 shrink-0 text-gold" aria-hidden />
                    {WILLINGNESS_LABELS[c] ?? c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button asChild size="sm" variant="outline" className="gap-1.5 self-start">
            <Link href={`/expert/projects/${opportunity.projectId}`}>
              Open the project
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </Card>
      ) : opportunity.response === "not_for_me" ? (
        <Card className="p-4">
          <p className="text-sm text-gray-300">
            You marked this as <span className="font-medium text-gray-100">not for me</span>. It won&apos;t come back to
            you.
          </p>
        </Card>
      ) : (
        <>
          <div>
            <p className="mb-1 text-sm font-medium text-gray-100">How would you like to contribute?</p>
            <p className="mb-1 text-xs text-gray-500">
              Choose how you&apos;d like to support the client. You can select more than one.
            </p>
            {requested.length > 0 && (
              <p className="mt-2 text-xs text-gray-600">The client asked for {requested.join(", ")}.</p>
            )}
            <div className="mt-3 grid auto-rows-fr gap-3 sm:grid-cols-2">
              {ENGAGEMENT_MODES.map((mode) => (
                <OptionCard
                  key={mode.key}
                  selected={offered.includes(mode.key)}
                  onToggle={() =>
                    setOffered((prev) =>
                      prev.includes(mode.key) ? prev.filter((x) => x !== mode.key) : [...prev, mode.key],
                    )
                  }
                  title={mode.title}
                  description={mode.description}
                  icon={MODE_ICONS[mode.key]}
                />
              ))}
            </div>
          </div>

          <FieldError>{error}</FieldError>

          <div className="flex flex-wrap gap-2">
            <Button
              className="gap-1.5"
              loading={responding}
              disabled={offered.length === 0 || !access.canAcceptWork}
              onClick={() => respond("interested")}
            >
              <ThumbsUp className="size-4" aria-hidden />
              I&apos;m interested
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button variant="outline" className="gap-1.5" loading={responding} onClick={() => respond("not_for_me")}>
              <ThumbsDown className="size-4" aria-hidden />
              Not for me
            </Button>
            {!access.canAcceptWork && (
              <span className="self-center text-xs text-gray-500">
                You can decline now, but expressing interest needs an approved profile.
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
