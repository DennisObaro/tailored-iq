"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ThumbsDown,
  ChevronRight,
  ArrowRight,
  Check,
  Phone,
  BookOpen,
  Briefcase,
  ClipboardList,
  type IconComponent,
} from "@/components/icons";
import type { ExpertProfile, ExpertWillingness } from "@/lib/types";
import * as opportunitiesApi from "@/lib/api/opportunities";
import * as expertApi from "@/lib/api/expert-onboarding";
import * as workspaceApi from "@/lib/api/playbook-workspace";
import { useSessionStore } from "@/lib/store/use-session-store";
import { ENGAGEMENT_MODES, WILLINGNESS_LABELS } from "@/lib/constants/expert";
import { DIAGNOSTIC_QUESTIONS } from "@/lib/ai-sim/chat-responder";
import { getExpertAccess } from "@/lib/utils/expert-access";
import { ExpertAccessBanner } from "@/components/expert/expert-gate";
import { OptionCard } from "@/components/expert/onboarding/step-shell";
import { BriefReadout } from "@/components/brief/brief-readout";
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
  const router = useRouter();
  const user = useSessionStore((s) => s.user);

  const [listing, setListing] = useState<opportunitiesApi.OpportunityListing | null | undefined>(undefined);
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [offered, setOffered] = useState<ExpertWillingness[]>([]);
  /**
   * "Sit this one out" is a fourth card in the same grid as the three
   * contribution modes, but it isn't one of them — declining and
   * contributing can't both be true, so picking either clears the other
   * rather than letting them multi-select together.
   */
  const [declined, setDeclined] = useState(false);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await opportunitiesApi.getOpportunity(opportunityId, user?.id);
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
    })();
    return () => {
      cancelled = true;
    };
  }, [opportunityId, user]);

  /** Picking a contribution mode is a decision to take part, so it clears "Sit this one out" if it was picked. */
  function toggleMode(key: ExpertWillingness) {
    setDeclined(false);
    setOffered((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  }

  /** The reverse: declining clears whatever contribution modes were picked. */
  function toggleDecline() {
    setOffered([]);
    setDeclined((prev) => !prev);
  }

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
       * below says so and offers the project as a link instead. The one
       * exception is the playbook hand-off further down, which is a place to
       * start working rather than a claim on the engagement.
       *
       */
      /**
       * Offering to contribute to the playbook is a decision to start writing,
       * so this goes straight into the generated draft — seating the expert on
       * the way in — rather than leaving them on a confirmation to find their
       * own way there. The response is already recorded by this point, so a
       * workspace that can't be opened (at capacity, or a project with no
       * brief and report behind it) falls back to the confirmation below.
       */
      if (response === "interested" && offered.includes("playbook_contribution") && user) {
        try {
          const workspace = await workspaceApi.openWorkspaceForProject(updated.opportunity.projectId, user.id);
          if (workspace) {
            router.push(`/expert/playbooks/${workspace.documentId}`);
            return;
          }
          setError("Your interest is recorded, but this playbook hasn't been generated yet.");
        } catch (e) {
          setError(
            e instanceof Error
              ? `Your interest is recorded, but we couldn't open the playbook: ${e.message}`
              : "Your interest is recorded, but we couldn't open the playbook.",
          );
        }
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

      {/*
        The brief itself, exactly as the client confirmed it — the one thing
        that tells an expert whether they can actually help. It stands in for
        both the relevance blurb and the old challenge card: those described
        the challenge second-hand while the brief was still behind the accept
        gate, which asked the expert to opt in on a one-line summary.
      */}
      {listing.brief && <BriefReadout brief={listing.brief} title="The client's brief" />}

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

          <FieldError>{error}</FieldError>

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
            <p className="text-sm font-medium text-gray-100">How would you like to contribute?</p>
            <div className="mt-3 grid auto-rows-fr gap-3 sm:grid-cols-2">
              {ENGAGEMENT_MODES.map((mode) => (
                <OptionCard
                  key={mode.key}
                  selected={offered.includes(mode.key)}
                  onToggle={() => toggleMode(mode.key)}
                  title={mode.title}
                  description={mode.description}
                  icon={MODE_ICONS[mode.key]}
                />
              ))}
              {/*
                A fourth tile rather than a separate button below the grid: it
                completes the 2x2 layout, and it's a choice made alongside the
                other three rather than an escape hatch from them.
              */}
              <OptionCard
                selected={declined}
                onToggle={toggleDecline}
                title="Sit this one out"
                description="This isn't a fit for you right now."
                icon={ThumbsDown}
              />
            </div>
          </div>

          <FieldError>{error}</FieldError>

          <div className="flex flex-wrap gap-2">
            <Button
              className="gap-1.5"
              loading={responding}
              disabled={!declined && (offered.length === 0 || !access.canAcceptWork)}
              onClick={() => respond(declined ? "not_for_me" : "interested")}
            >
              Proceed
              <ArrowRight className="size-4" aria-hidden />
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
