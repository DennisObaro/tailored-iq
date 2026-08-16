"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Video, ShieldCheck, Star, ChevronRight, HandHeart } from "lucide-react";
import type { Consultation, ExpertWillingness, User, Review } from "@/lib/types";
import * as consultationsApi from "@/lib/api/consultations";
import * as usersApi from "@/lib/api/users";
import { useSessionStore } from "@/lib/store/use-session-store";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/utils/format";
import { WILLINGNESS_LABELS } from "@/lib/constants/expert";
import { Checkbox } from "@/components/ui/checkbox";

/** What an expert can offer to do next after a call (spec §19). */
const FOLLOW_UP_OPTIONS: ExpertWillingness[] = [
  "advisory_call",
  "playbook_contribution",
  "contribute_insight",
  "review",
  "consulting_engagement",
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} type="button">
          <Star className={`size-5 ${n <= value ? "fill-primary-400 text-primary-400" : "text-gray-700"}`} />
        </button>
      ))}
    </div>
  );
}

export default function ConsultationLobbyPage() {
  const { consultationId } = useParams<{ consultationId: string }>();
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
    async function load() {
      const c = await consultationsApi.getConsultation(consultationId, currentUser?.id);
      if (!c || cancelled) return;
      setConsultation(c);
      const [e, cl] = await Promise.all([usersApi.getUser(c.expertId), usersApi.getUser(c.clientId)]);
      if (!cancelled) {
        setExpert(e);
        setClient(cl);
      }
      if (c.status === "completed") {
        const r = await consultationsApi.getReviewForConsultation(c.id);
        if (!cancelled) setReview(r);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [consultationId, currentUser?.id]);

  async function submitFeedback() {
    if (!consultation || !currentUser) return;
    setSubmitting(true);
    const r = await consultationsApi.submitReview({
      consultationId: consultation.id,
      fromUserId: currentUser.id,
      toUserId: consultation.expertId,
      usefulness,
      understanding,
      rating,
      comment: comment || undefined,
    });
    setReview(r);
    setSubmitting(false);
  }

  if (consultation === undefined || !expert) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6">
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

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link href={isExpert ? "/expert/calls" : "/conversations"} className="hover:text-gray-300">
          {isExpert ? "Calls" : "Conversations"}
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="text-gray-300">
          {counterpart ? `${counterpart.firstName} ${counterpart.lastName}` : "Consultation"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Avatar
          firstName={counterpart?.firstName ?? expert.firstName}
          lastName={counterpart?.lastName ?? expert.lastName}
          size="lg"
        />
        <div>
          <p className="text-sm font-medium text-gray-50">
            Consultation with {counterpart ? `${counterpart.firstName} ${counterpart.lastName}` : "your client"}
          </p>
          <p className="text-xs text-gray-400">{formatDateTime(consultation.scheduledFor)}</p>
        </div>
        <StatusBadge status={consultation.status} className="ml-auto" />
      </div>

      {consultation.status === "scheduled" && (
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-start gap-2 text-xs text-gray-400">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary-400" aria-hidden />
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
                    <HandHeart className="size-4 text-primary-400" aria-hidden />
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

          <Button asChild variant="ghost" size="sm">
            <Link href={isExpert ? `/expert/projects/${consultation.projectId}` : `/projects/${consultation.projectId}`}>
              Back to project
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}
