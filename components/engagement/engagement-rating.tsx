"use client";

import { useState } from "react";
import type { EngagementReview } from "@/lib/types";
import type { EngagementDetail } from "@/lib/api/engagements";
import * as engagementsApi from "@/lib/api/engagements";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { StarRating } from "@/components/ui/star-rating";

export function EngagementRating({
  detail,
  onSubmitted,
}: {
  detail: EngagementDetail;
  onSubmitted: (review: EngagementReview) => void;
}) {
  const { engagement, counterpart, viewerRole, myReview, otherReview } = detail;
  const viewerId = viewerRole === "client" ? engagement.clientId : engagement.expertId;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const review = await engagementsApi.submitEngagementReview({
        engagementId: engagement.id,
        fromUserId: viewerId,
        toUserId: counterpart.id,
        rating,
        comment: comment || undefined,
      });
      onSubmitted(review);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-medium uppercase tracking-wide text-gray-500">Rating</h2>
      {myReview ? (
        <Card className="p-3 text-sm text-gray-300">
          You rated {counterpart.firstName} {myReview.rating} / 5.
          {myReview.comment && <p className="mt-1 text-gray-400">{myReview.comment}</p>}
        </Card>
      ) : (
        <Card className="flex flex-col gap-3 p-3">
          <StarRating value={rating} onChange={setRating} />
          <Textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional comment..." />
          <Button size="sm" loading={submitting} disabled={!rating} onClick={submit}>
            Submit rating
          </Button>
        </Card>
      )}
      {otherReview && (
        <p className="text-xs text-gray-500">
          {counterpart.firstName} rated this {otherReview.rating} / 5.
        </p>
      )}
    </div>
  );
}
