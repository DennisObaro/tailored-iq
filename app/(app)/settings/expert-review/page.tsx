"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import * as expertApi from "@/lib/api/expert-onboarding";
import { ExpertProfilePreview } from "@/components/expert/expert-profile-preview";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { formatDateTime } from "@/lib/utils/format";

/**
 * Stands in for the reviewer tool a real deployment would put behind an
 * admin role. It runs against the same decideExpertReview call an internal
 * console would, so the approval half of the expert lifecycle is real and
 * demonstrable rather than something that "happens elsewhere".
 */
export default function ExpertReviewQueuePage() {
  const [queue, setQueue] = useState<expertApi.PendingExpertListing[] | null>(null);
  const [reload, setReload] = useState(0);
  const refetch = () => setReload((n) => n + 1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [deciding, setDeciding] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [decided, setDecided] = useState<{ name: string; decision: string } | null>(null);

  async function load() {
    try {
      const pending = await expertApi.listExpertsAwaitingReview();
      setError(false);
      setQueue(pending);
    } catch {
      setError(true);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  async function decide(userId: string, name: string, decision: "approved" | "rejected" | "restricted") {
    setDeciding(userId);
    try {
      await expertApi.decideExpertReview(userId, decision, reason.trim() || undefined);
      setDecided({ name, decision });
      setReason("");
      setOpenId(null);
      refetch();
    } finally {
      setDeciding(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <div className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/settings" className="hover:text-gray-300">
            Settings
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span className="text-gray-300">Expert review</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-50">Expert review queue</h1>
        <p className="mt-1 text-sm text-gray-400">
          Experts awaiting a verification decision. In a real deployment this sits behind an internal admin role.
        </p>
      </div>

      {decided && (
        <Card className="border-success-500/30 bg-success-500/5 p-4">
          <p className="text-sm text-gray-200">
            {decided.name} was {decided.decision}. They&apos;ve been notified.
          </p>
        </Card>
      )}

      {error ? (
        <ErrorState
          whatHappened="We couldn't load the review queue."
          dataSafe="No decisions have been changed."
          onRetry={refetch}
        />
      ) : !queue ? (
        <Skeleton className="h-40 w-full" />
      ) : queue.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Nothing awaiting review." description="Submitted expert profiles appear here." />
      ) : (
        <div className="flex flex-col gap-4">
          {queue.map(({ user, profile, referrerName }) => (
            <Card key={user.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-50">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{profile.headline}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {referrerName && <Badge variant="outline">Referred by {referrerName}</Badge>}
                    <Badge variant="outline">{profile.evidence.length} evidence items</Badge>
                    <Badge variant={profile.ethicsQuizComplete ? "success" : "danger"}>
                      {profile.ethicsQuizComplete ? "Quiz passed" : "Quiz not passed"}
                    </Badge>
                    {profile.expertise.some((e) => e.evidenceStatus === "evidence_submitted") && (
                      <Badge>Manual expertise claim to check</Badge>
                    )}
                  </div>
                  {profile.submittedAt && (
                    <p className="mt-2 text-xs text-gray-500">Submitted {formatDateTime(profile.submittedAt)}</p>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => setOpenId(openId === user.id ? null : user.id)}>
                  {openId === user.id ? "Hide profile" : "Review profile"}
                </Button>
              </div>

              {openId === user.id && (
                <div className="mt-4 flex flex-col gap-4 border-t border-gray-800 pt-4">
                  {profile.expertise
                    .filter((e) => e.supportingEvidence)
                    .map((e) => (
                      <Card key={e.label} className="p-3">
                        <p className="text-xs font-medium text-gray-300">Claimed: {e.label}</p>
                        <p className="mt-1 text-sm text-gray-400">{e.supportingEvidence}</p>
                      </Card>
                    ))}

                  <ExpertProfilePreview user={user} profile={profile} />

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`reason-${user.id}`}>Reason (required when declining or restricting)</Label>
                    <Textarea
                      id={`reason-${user.id}`}
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. We couldn't verify the governance experience claimed."
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      loading={deciding === user.id}
                      onClick={() => decide(user.id, user.firstName, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!reason.trim()}
                      loading={deciding === user.id}
                      onClick={() => decide(user.id, user.firstName, "restricted")}
                    >
                      Restrict
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={!reason.trim()}
                      loading={deciding === user.id}
                      onClick={() => decide(user.id, user.firstName, "rejected")}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
