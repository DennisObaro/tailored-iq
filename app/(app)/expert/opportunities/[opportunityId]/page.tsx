"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Lock,
  ClipboardCheck,
  Lightbulb,
  Phone,
  BookOpen,
  Briefcase,
  type IconComponent,
} from "@/components/icons";
import type { ExpertProfile, ExpertWillingness, Project } from "@/lib/types";
import * as opportunitiesApi from "@/lib/api/opportunities";
import * as projectsApi from "@/lib/api/projects";
import * as expertApi from "@/lib/api/expert-onboarding";
import { useSessionStore } from "@/lib/store/use-session-store";
import { WILLINGNESS_LABELS } from "@/lib/constants/expert";
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

const CONTRIBUTION_DESCRIPTIONS: Record<ExpertWillingness, string> = {
  review: "Read the recommendations and say where they're wrong or thin.",
  contribute_insight: "Write up the part of this you've lived through.",
  advisory_call: "Talk to the client directly about their situation.",
  playbook_contribution: "Strengthen the playbook they'll actually work from.",
  consulting_engagement: "Take on longer, paid work beyond a single conversation.",
};

const CONTRIBUTION_ICONS: Record<ExpertWillingness, IconComponent> = {
  review: ClipboardCheck,
  contribute_insight: Lightbulb,
  advisory_call: Phone,
  playbook_contribution: BookOpen,
  consulting_engagement: Briefcase,
};

const ALL: ExpertWillingness[] = [
  "review",
  "contribute_insight",
  "advisory_call",
  "playbook_contribution",
  "consulting_engagement",
];

export default function OpportunityDetailPage() {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const router = useRouter();
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
      if (response === "interested") {
        setTimeout(() => router.push(`/expert/projects/${updated.opportunity.projectId}`), 700);
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
  const available: ExpertWillingness[] = ALL.filter(
    (w) => opportunity.requestedContributions.includes(w as never) || (profile?.willingness ?? []).includes(w),
  );

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
                The client&apos;s brief, report and any transcripts stay private until you accept — and only for as long
                as you&apos;re engaged on the project.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {opportunity.response ? (
        <Card className="p-4">
          <p className="text-sm text-gray-300">
            You marked this as{" "}
            <span className="font-medium text-gray-100">
              {opportunity.response === "interested" ? "interested" : "not for me"}
            </span>
            {opportunity.response === "interested" && opportunity.offeredContributions.length > 0 && (
              <>
                {" "}
                and offered to {opportunity.offeredContributions.map((c) => WILLINGNESS_LABELS[c].toLowerCase()).join(", ")}
              </>
            )}
            .
          </p>
        </Card>
      ) : (
        <>
          <div>
            <p className="mb-1 text-sm font-medium text-gray-100">What are you willing to do?</p>
            <p className="mb-3 text-xs text-gray-500">
              The client asked for {opportunity.requestedContributions.map((c) => WILLINGNESS_LABELS[c].toLowerCase()).join(", ")}.
              Offer only what you actually want to take on.
            </p>
            <div className="grid auto-rows-fr gap-3 sm:grid-cols-2">
              {available.map((w) => (
                <OptionCard
                  key={w}
                  selected={offered.includes(w)}
                  onToggle={() => setOffered((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]))}
                  title={WILLINGNESS_LABELS[w]}
                  description={CONTRIBUTION_DESCRIPTIONS[w]}
                  icon={CONTRIBUTION_ICONS[w]}
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
            </Button>
            <Button variant="outline" className="gap-1.5" loading={responding} onClick={() => respond("not_for_me")}>
              <ThumbsDown className="size-4" aria-hidden />
              Not for me
            </Button>
            {!access.canAcceptWork && (
              <span className="self-center text-xs text-gray-500">
                You can decline now, but accepting needs an approved profile.
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
