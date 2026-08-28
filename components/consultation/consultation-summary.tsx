"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Video, ShieldCheck, HandHeart } from "@/components/icons";
import type { Consultation, ExpertWillingness, User, Review } from "@/lib/types";
import * as consultationsApi from "@/lib/api/consultations";
import * as usersApi from "@/lib/api/users";
import { useSessionStore } from "@/lib/store/use-session-store";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { StarRating } from "@/components/ui/star-rating";
import { formatDateTime } from "@/lib/utils/format";
import { WILLINGNESS_LABELS } from "@/lib/constants/expert";
import { cn } from "@/lib/utils/cn";

/** What an expert can offer to do next after a call (spec §19). */
const FOLLOW_UP_OPTIONS: ExpertWillingness[] = [
  "advisory_call",
  "playbook_contribution",
  "contribute_insight",
  "review",
  "consulting_engagement",
];

/**
 * Everything there is to say about one consultation: what came out of it, the
 * transcript, and the one thing this viewer still has to do about it — rate it
 * if they're the client, offer further help if they're the expert.
 *
 * Loads by id rather than taking a Consultation, so the two places it appears
 * — its own page and the panel beside the conversation it belongs to — don't
 * have to agree on who fetches what. The forms own their state here, which is
 * what makes the panel a real place to act rather than a preview of one.
 */
export function ConsultationSummary({
  consultationId,
  variant = "page",
  className,
}: {
  consultationId: string;
  /** `panel` drops the navigation out of the card — the host already has it. */
  variant?: "page" | "panel";
  className?: string;
}) {
  const router = useRouter();
  const currentUser = useSessionStore((s) => s.user);

  const [consultation, setConsultation] = useState<Consultation | null | undefined>(undefined);
  const [expert, setExpert] = useState<User | null>(null);
  const [client, setClient] = useState<User | null>(null);
  const [followUpTypes, setFollowUpTypes] = useState<ExpertWillingness[]>([]);
  const [followUpNote, setFollowUpNote] = useState("");
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [usefulness, setUsefulness] = useState(0);
  const [understanding, setUnderstanding] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const c = await consultationsApi.getConsultation(consultationId, currentUser?.id);
      if (cancelled) return;
      setConsultation(c);
      if (!c) return;

      const [e, cl] = await Promise.all([usersApi.getUser(c.expertId), usersApi.getUser(c.clientId)]);
      if (cancelled) return;
      setExpert(e);
      setClient(cl);

      if (c.status === "completed") {
        const r = await consultationsApi.getReviewForConsultation(c.id);
        if (!cancelled) setReview(r);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [consultationId, currentUser]);

  async function submitFeedback() {
    if (!consultation || !currentUser) return;
    setSubmitting(true);
    setReview(
      await consultationsApi.submitReview({
        consultationId: consultation.id,
        fromUserId: currentUser.id,
        toUserId: consultation.expertId,
        usefulness,
        understanding,
        rating,
        comment: comment || undefined,
      }),
    );
    setSubmitting(false);
  }

  async function saveFollowUp() {
    if (!consultation) return;
    setSavingFollowUp(true);
    setFollowUpError(null);
    try {
      setConsultation(
        await consultationsApi.expressFollowUpInterest(consultation.id, followUpTypes, followUpNote),
      );
    } catch (e) {
      setFollowUpError(e instanceof Error ? e.message : "We couldn't record that just now.");
    } finally {
      setSavingFollowUp(false);
    }
  }

  if (consultation === undefined || (consultation && !expert)) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!consultation) return null;

  /**
   * The same call, seen from both sides: the client rates the expert, the
   * expert says whether they could help further. Neither sees the other's
   * form.
   */
  const isExpert = currentUser?.id === consultation.expertId;
  const counterpart = isExpert ? client : expert;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center gap-3">
        <Avatar
          firstName={counterpart?.firstName ?? expert?.firstName ?? ""}
          lastName={counterpart?.lastName ?? expert?.lastName ?? ""}
          src={counterpart?.avatarUrl}
          size="lg"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-50">
            Consultation with {counterpart ? `${counterpart.firstName} ${counterpart.lastName}` : "your client"}
          </p>
          <p className="text-xs text-gray-400">{formatDateTime(consultation.scheduledFor)}</p>
        </div>
        <StatusBadge status={consultation.status} className="ml-auto shrink-0" />
      </div>

      {consultation.status === "scheduled" && (
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-start gap-2 text-xs text-gray-400">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
            This call happens on TailoredIQ and will be recorded and transcribed with your consent, to help
            capture useful insights for your project.
          </div>
          <Button
            size="lg"
            className="w-full justify-center gap-2"
            onClick={() => router.push(`/consultations/${consultation.id}/call`)}
          >
            <Video className="size-4" aria-hidden />
            Join call
          </Button>
        </Card>
      )}

      {consultation.status === "in_call" && (
        <Card className="p-5">
          <p className="text-sm text-gray-300">Your call is in progress.</p>
          <Button
            size="sm"
            className="mt-3"
            onClick={() => router.push(`/consultations/${consultation.id}/call`)}
          >
            Return to call
          </Button>
        </Card>
      )}

      {consultation.status === "completed" && (
        <>
          {/* Older consultations predate transcription — don't show empty shells for them. */}
          {(consultation.extractedInsights?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>What came out of the conversation</CardTitle>
                <p className="text-xs text-gray-500">
                  Pulled from the transcript and added to the project&apos;s knowledge — the playbook can build on it.
                </p>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1.5 pl-4 text-sm text-gray-300">
                  {consultation.extractedInsights?.map((insight, i) => <li key={i}>{insight}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}

          {(consultation.transcript?.length ?? 0) > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Transcript</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {consultation.transcript?.map((line, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium capitalize text-gray-400">{line.speaker}: </span>
                    <span className="text-gray-300">{line.text}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="p-4">
              <p className="text-sm text-gray-400">
                This call wasn&apos;t recorded, so there&apos;s no transcript or extracted insight for it.
              </p>
            </Card>
          )}

          {isExpert ? (
            consultation.expertFollowUp ? (
              <Card className="p-5">
                <p className="text-sm font-medium text-gray-50">You offered further support</p>
                <p className="mt-1.5 text-sm text-gray-400">
                  {consultation.expertFollowUp.supportTypes.map((t) => WILLINGNESS_LABELS[t]).join(" · ")}
                </p>
                {consultation.expertFollowUp.note && (
                  <p className="mt-2 text-sm text-gray-300">{consultation.expertFollowUp.note}</p>
                )}
              </Card>
            ) : (
              <Card className="flex flex-col gap-4 p-5">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium text-gray-50">
                    <HandHeart className="size-4 text-gold" aria-hidden />
                    Could you support this project further?
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    The client sees this as an offer they can act on — pick only what you&apos;d actually take on.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {FOLLOW_UP_OPTIONS.map((option) => (
                    <label key={option} className="flex items-center gap-2 text-sm text-gray-300">
                      <Checkbox
                        checked={followUpTypes.includes(option)}
                        onChange={() =>
                          setFollowUpTypes((prev) =>
                            prev.includes(option) ? prev.filter((t) => t !== option) : [...prev, option],
                          )
                        }
                      />
                      {WILLINGNESS_LABELS[option]}
                    </label>
                  ))}
                </div>
                <Textarea
                  rows={3}
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="Anything you'd add about how you could help — optional."
                />
                {followUpError && <p className="text-xs text-danger-400">{followUpError}</p>}
                <Button loading={savingFollowUp} disabled={followUpTypes.length === 0} onClick={saveFollowUp}>
                  Tell the client I&apos;m interested
                </Button>
              </Card>
            )
          ) : review ? (
            <Card className="p-5">
              <p className="text-sm text-gray-300">Thanks for your feedback.</p>
            </Card>
          ) : (
            <Card className="flex flex-col gap-4 p-5">
              <p className="text-sm font-medium text-gray-50">How was this consultation?</p>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-gray-400">Usefulness</p>
                <StarRating value={usefulness} onChange={setUsefulness} />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-gray-400">Understanding of your challenge</p>
                <StarRating value={understanding} onChange={setUnderstanding} />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-gray-400">Overall rating</p>
                <StarRating value={rating} onChange={setRating} />
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optional comment..."
                rows={2}
              />
              <Button loading={submitting} disabled={!rating} onClick={submitFeedback}>
                Submit feedback
              </Button>
            </Card>
          )}

          {variant === "page" && (
            <Button asChild variant="ghost" size="sm">
              <Link
                href={
                  isExpert
                    ? `/expert/projects/${consultation.projectId}`
                    : `/projects/${consultation.projectId}`
                }
              >
                Back to project
              </Link>
            </Button>
          )}
        </>
      )}
    </div>
  );
}
