"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import type { Engagement, EngagementReview } from "@/lib/types";
import type { EngagementDetail } from "@/lib/api/engagements";
import * as engagementsApi from "@/lib/api/engagements";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { StarRating } from "@/components/ui/star-rating";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRelative } from "@/lib/utils/format";

export function EngagementHeader({
  detail,
  onChange,
  onReviewSubmitted,
}: {
  detail: EngagementDetail;
  onChange: (engagement: Engagement) => void;
  onReviewSubmitted?: (review: EngagementReview) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { engagement, counterpart, playbook, viewerRole } = detail;
  const viewerId = viewerRole === "client" ? engagement.clientId : engagement.expertId;

  function closeRatingDialog() {
    setRatingOpen(false);
    setRating(0);
    setComment("");
  }

  // The rating prompt fires the moment someone marks their side done, rather
  // than waiting for the other party to confirm — by then whatever they
  // thought of the engagement is stale and they may never come back to say it.
  async function proposeWithRating() {
    setBusy(true);
    try {
      const updated = await engagementsApi.proposeCompletion(engagement.id, viewerId);
      onReviewSubmitted?.(
        await engagementsApi.submitEngagementReview({
          engagementId: engagement.id,
          fromUserId: viewerId,
          toUserId: counterpart.id,
          rating,
          comment: comment || undefined,
        }),
      );
      onChange(updated);
      closeRatingDialog();
    } finally {
      setBusy(false);
    }
  }
  async function skipRatingAndPropose() {
    setBusy(true);
    try {
      onChange(await engagementsApi.proposeCompletion(engagement.id, viewerId));
      closeRatingDialog();
    } finally {
      setBusy(false);
    }
  }
  async function confirm() {
    setBusy(true);
    try {
      onChange(await engagementsApi.confirmCompletion(engagement.id, viewerId));
    } finally {
      setBusy(false);
    }
  }
  async function retract() {
    setBusy(true);
    try {
      onChange(await engagementsApi.retractCompletionProposal(engagement.id, viewerId));
    } finally {
      setBusy(false);
    }
  }

  const iProposed = engagement.status === "pending_completion" && engagement.completionProposedBy === viewerRole;

  return (
    <header className="shrink-0 border-b border-gray-800 px-6 py-4">
      <div className="mx-auto mb-3 max-w-3xl">
        <Link
          href="/engagements"
          className="-ml-1 inline-flex items-center gap-0.5 rounded-md py-0.5 pl-1 pr-2 text-xs text-gray-500 hover:text-gray-300"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          Projects
        </Link>
      </div>
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-start gap-3">
          <Avatar firstName={counterpart.firstName} lastName={counterpart.lastName} src={counterpart.avatarUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-50">
              {counterpart.firstName} {counterpart.lastName}
            </p>
            <Link
              href={`/playbooks/${playbook.id}`}
              className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-300"
            >
              {playbook.title}
              <ChevronRight className="size-3" aria-hidden />
            </Link>
            <p className="mt-0.5 text-xs text-gray-500">Started {formatRelative(engagement.createdAt)}</p>
          </div>
          <StatusBadge status={engagement.status} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {engagement.status === "in_progress" && (
            <Button size="sm" variant="outline" onClick={() => setRatingOpen(true)}>
              Mark as complete
            </Button>
          )}
          {engagement.status === "pending_completion" && iProposed && (
            <>
              <p className="text-xs text-gray-400">Waiting for {counterpart.firstName} to confirm.</p>
              <Button size="sm" variant="ghost" loading={busy} onClick={retract}>
                Retract
              </Button>
            </>
          )}
          {engagement.status === "pending_completion" && !iProposed && (
            <>
              <Button size="sm" loading={busy} onClick={confirm}>
                Confirm completion
              </Button>
              <Button size="sm" variant="ghost" loading={busy} onClick={retract}>
                Not yet — keep going
              </Button>
            </>
          )}
        </div>
      </div>

      <Dialog open={ratingOpen} onOpenChange={(open) => !open && closeRatingDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark this project as complete?</DialogTitle>
            <DialogDescription>
              Let {counterpart.firstName} know how it went. {counterpart.firstName} will be asked to confirm
              before this project shows as fully completed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <StarRating value={rating} onChange={setRating} />
            <Textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional comment..."
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" loading={busy} onClick={skipRatingAndPropose}>
              Skip and mark complete
            </Button>
            <Button size="sm" loading={busy} disabled={!rating} onClick={proposeWithRating}>
              Submit rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
