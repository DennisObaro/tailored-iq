"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Check, MessageSquareWarning, Send } from "@/components/icons";
import type { ExpertContribution, ExpertPeerReview, ExpertProfile, User } from "@/lib/types";
import * as contributionsApi from "@/lib/api/contributions";
import * as expertApi from "@/lib/api/expert-onboarding";
import * as usersApi from "@/lib/api/users";
import { useSessionStore } from "@/lib/store/use-session-store";
import { CONTRIBUTION_TYPE_LABELS } from "@/lib/constants/expert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Textarea, Label } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { formatDateTime } from "@/lib/utils/format";

/** Draft → submitted → under review → published, shown as the record it is. */
const LIFECYCLE: { status: ExpertContribution["status"]; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "submitted", label: "Submitted" },
  { status: "under_review", label: "Under review" },
  { status: "approved", label: "Approved" },
  { status: "published", label: "Published" },
];

export default function ContributionDetailPage() {
  const { contributionId } = useParams<{ contributionId: string }>();
  const user = useSessionStore((s) => s.user);
  const [reload, setReload] = useState(0);
  const refetch = () => setReload((n) => n + 1);

  const [contribution, setContribution] = useState<ExpertContribution | null | undefined>(undefined);
  const [author, setAuthor] = useState<User | null>(null);
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [reviews, setReviews] = useState<{ review: ExpertPeerReview; reviewer: User }[]>([]);
  const [comment, setComment] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const c = await contributionsApi.getContribution(contributionId);
    if (!c) {
      setContribution(null);
      return;
    }
    const [a, list, p] = await Promise.all([
      usersApi.getUser(c.expertId),
      contributionsApi.listPeerReviewsForContribution(c.id),
      user ? expertApi.getExpertProfile(user.id) : Promise.resolve(null),
    ]);
    setContribution(c);
    setAuthor(a);
    setReviews(list);
    setProfile(p);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contributionId, user, reload]);

  async function review(verdict: "approve" | "request_changes") {
    if (!user) return;
    setWorking(true);
    setError(null);
    try {
      await contributionsApi.submitPeerReview({
        contributionId,
        reviewerId: user.id,
        verdict,
        comment,
      });
      setComment("");
      refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't record your review.");
    } finally {
      setWorking(false);
    }
  }

  async function submitDraft() {
    setWorking(true);
    setError(null);
    try {
      await contributionsApi.submitContribution(contributionId);
      refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't submit this contribution.");
    } finally {
      setWorking(false);
    }
  }

  if (contribution === undefined) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!contribution) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <ErrorState whatHappened="We couldn't find this contribution." dataSafe="Nothing has been lost." />
      </div>
    );
  }

  const isAuthor = user?.id === contribution.expertId;
  const alreadyReviewed = reviews.some((r) => r.review.reviewerId === user?.id);
  const canReview =
    !isAuthor &&
    profile?.verificationStatus === "approved" &&
    (contribution.status === "submitted" || contribution.status === "under_review") &&
    !alreadyReviewed;

  const currentIndex = LIFECYCLE.findIndex((l) => l.status === contribution.status);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <div className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/expert/contributions" className="hover:text-gray-300">
            Contributions
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span className="truncate text-gray-300">{contribution.title}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{CONTRIBUTION_TYPE_LABELS[contribution.type]}</Badge>
          <StatusBadge status={contribution.status} />
          {contribution.incorporated && <Badge variant="success">In the client&apos;s playbook</Badge>}
          {contribution.pointsAwarded > 0 && <Badge variant="primary">+{contribution.pointsAwarded} points</Badge>}
        </div>
        <h1 className="mt-2 text-xl font-semibold text-gray-50">{contribution.title}</h1>
        {author && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <Avatar firstName={author.firstName} lastName={author.lastName} src={author.avatarUrl} size="sm" />
            {author.firstName} {author.lastName} · {formatDateTime(contribution.createdAt)}
          </div>
        )}
      </div>

      {currentIndex >= 0 && (
        <Card className="p-4">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {LIFECYCLE.map((stage, index) => (
              <li key={stage.status} className="flex items-center gap-2">
                <span className={index <= currentIndex ? "text-primary-400" : "text-gray-600"}>{stage.label}</span>
                {index < LIFECYCLE.length - 1 && <ChevronRight className="size-3 text-gray-700" aria-hidden />}
              </li>
            ))}
          </ol>
        </Card>
      )}

      <Card>
        <CardContent className="pt-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200">{contribution.content}</p>
        </CardContent>
      </Card>

      {contribution.status === "draft" && isAuthor && (
        <Button className="gap-1.5 self-start" loading={working} onClick={submitDraft}>
          <Send className="size-4" aria-hidden />
          Submit for peer review
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Peer review</CardTitle>
          <p className="text-xs text-gray-500">
            Contributions are read by an expert who wasn&apos;t involved before they reach the network.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400">No reviews yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {reviews.map(({ review: r, reviewer }) => (
                <li key={r.id} className="rounded-lg border border-gray-800 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Avatar firstName={reviewer.firstName} lastName={reviewer.lastName} src={reviewer.avatarUrl} size="sm" />
                    <span className="text-sm text-gray-200">
                      {reviewer.firstName} {reviewer.lastName}
                    </span>
                    <Badge variant={r.verdict === "approve" ? "success" : "outline"}>
                      {r.verdict === "approve" ? "Approved" : "Changes requested"}
                    </Badge>
                    <span className="text-xs text-gray-500">{formatDateTime(r.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-300">{r.comment}</p>
                </li>
              ))}
            </ul>
          )}

          {canReview && (
            <div className="flex flex-col gap-2 border-t border-gray-800 pt-4">
              <Label htmlFor="review">Your review</Label>
              <Textarea
                id="review"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Does this hold up against your own experience? Say what's strong and what needs work."
              />
              {error && <p className="text-xs text-danger-400">{error}</p>}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="gap-1.5" loading={working} disabled={!comment.trim()} onClick={() => review("approve")}>
                  <Check className="size-4" aria-hidden />
                  Approve for publication
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  loading={working}
                  disabled={!comment.trim()}
                  onClick={() => review("request_changes")}
                >
                  <MessageSquareWarning className="size-4" aria-hidden />
                  Request changes
                </Button>
              </div>
            </div>
          )}

          {isAuthor && contribution.status === "changes_requested" && (
            <div className="border-t border-gray-800 pt-4">
              <p className="text-sm text-gray-400">
                A reviewer asked for changes. Update this contribution and resubmit it.
              </p>
              <Button size="sm" className="mt-2 gap-1.5" loading={working} onClick={submitDraft}>
                <Send className="size-4" aria-hidden />
                Resubmit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
