"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "@/components/icons";
import type { ConsultationMode, Playbook, Project } from "@/lib/types";
import * as expertsApi from "@/lib/api/experts";
import type { ExpertListing } from "@/lib/api/experts";
import type { AvailableSlot } from "@/lib/api/consultations";
import * as projectsApi from "@/lib/api/projects";
import * as consultationsApi from "@/lib/api/consultations";
import * as playbooksApi from "@/lib/api/playbooks";
import { useSessionStore } from "@/lib/store/use-session-store";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { AvailabilityCalendar } from "@/components/booking/availability-calendar";
import { describeAvailability } from "@/lib/utils/availability";
import { Video, MapPin } from "@/components/icons";

const NEW_CHALLENGE = "__new__";

export default function BookConsultationPage() {
  const { expertId } = useParams<{ expertId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useSessionStore((s) => s.user);

  const [listing, setListing] = useState<ExpertListing | null | undefined>(undefined);
  const [eligibleProjects, setEligibleProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(searchParams.get("projectId") ?? "");
  const [newChallenge, setNewChallenge] = useState("");
  const playbookId = searchParams.get("playbookId");
  const isImplementation = Boolean(playbookId);
  const [playbook, setPlaybook] = useState<Playbook | null | undefined>(undefined);
  const [mode, setMode] = useState<ConsultationMode>("virtual");
  const [slot, setSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[] | undefined>(undefined);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    expertsApi.getExpert(expertId).then(setListing);
  }, [expertId]);

  useEffect(() => {
    consultationsApi.listAvailableSlots(expertId).then(setSlots);
  }, [expertId]);

  useEffect(() => {
    if (!user || isImplementation) return;
    projectsApi.listProjects(user.id).then((projects) => {
      const eligible = projects.filter((p) => !p.consultationId);
      setEligibleProjects(eligible);
      if (!projectId && eligible.length > 0) setProjectId(eligible[0].id);
    });
  }, [user, projectId, isImplementation]);

  useEffect(() => {
    if (!playbookId || !user) return;
    playbooksApi.getPlaybook(playbookId, user.id).then(setPlaybook);
  }, [playbookId, user]);

  /**
   * The deliberate "I haven't worked this out yet" option — a client can come
   * straight to an expert without going through the diagnosis chat, and the
   * expert builds the brief with them on the call.
   *
   * A sentinel rather than the empty string, because "" is what the select
   * holds before the project list has loaded, and the effect above fills
   * that in with the first eligible project — an explicit choice has to be
   * distinguishable from an unanswered one or it gets overwritten.
   */
  const isNewChallenge = projectId === NEW_CHALLENGE;
  const canBook =
    Boolean(slot) && (isImplementation ? true : isNewChallenge ? newChallenge.trim().length > 0 : Boolean(projectId));

  async function confirmBooking() {
    if (!user || !slot || !canBook) return;
    setBooking(true);
    setError(null);
    try {
      if (isImplementation && playbookId) {
        const { engagementId } = await consultationsApi.bookImplementationConsultation({
          playbookId,
          clientId: user.id,
          expertId,
          scheduledFor: slot,
          mode,
        });
        router.push(`/engagements/${engagementId}`);
        return;
      }
      const { conversationId } = await consultationsApi.bookConsultation({
        ...(isNewChallenge ? { newChallenge: newChallenge.trim() } : { projectId }),
        clientId: user.id,
        expertId,
        scheduledFor: slot,
      });
      // Into the conversation rather than the call page: the useful thing to
      // do between booking and the call is talk to the expert.
      router.push(`/conversations/${conversationId}`);
    } catch (e) {
      /**
       * Surfaced rather than swallowed: "someone else just booked that time"
       * is the one failure a client can actually do something about, and the
       * refreshed calendar below shows them what's left.
       */
      setError(e instanceof Error ? e.message : "We couldn't confirm this booking.");
      setSlot(null);
      setSlots(await consultationsApi.listAvailableSlots(expertId));
    } finally {
      setBooking(false);
    }
  }

  if (listing === undefined) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <ErrorState whatHappened="We couldn't find this expert." dataSafe="Nothing has been lost." />
      </div>
    );
  }

  const { user: expertUser, profile } = listing;

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/experts" className="hover:text-gray-300">
          Experts
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <Link href={`/experts/${expertId}`} className="hover:text-gray-300">
          {expertUser.firstName} {expertUser.lastName}
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="text-gray-300">Book</span>
      </div>

      <div className="flex items-center gap-3">
        <Avatar firstName={expertUser.firstName} lastName={expertUser.lastName} size="lg" />
        <div>
          <p className="text-sm font-medium text-gray-50">
            Book time with {expertUser.firstName} {expertUser.lastName}
          </p>
          <p className="text-xs text-gray-400">{profile.currentRole}</p>
        </div>
      </div>

      <Card className="flex flex-col gap-4 p-4">
        {isImplementation ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-300">
              Implementing {playbook === undefined ? "…" : (playbook?.title ?? "this playbook")}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={mode === "virtual" ? "primary" : "outline"}
                className="gap-1.5"
                onClick={() => setMode("virtual")}
              >
                <Video className="size-3.5" aria-hidden />
                Virtual call
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "on_site" ? "primary" : "outline"}
                className="gap-1.5"
                onClick={() => setMode("on_site")}
              >
                <MapPin className="size-3.5" aria-hidden />
                On-site session
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300" htmlFor="project">
                Which challenge is this for?
              </label>
              <Select id="project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                {eligibleProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
                <option value={NEW_CHALLENGE}>A new challenge — we&apos;ll define it on the call</option>
              </Select>
            </div>

            {isNewChallenge && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-300" htmlFor="new-challenge">
                  What&apos;s on your mind?
                </label>
                <Textarea
                  id="new-challenge"
                  rows={3}
                  value={newChallenge}
                  onChange={(e) => setNewChallenge(e.target.value)}
                  placeholder="A line or two is enough — you'll work through it together on the call."
                />
                <p className="text-xs text-gray-500">
                  {expertUser.firstName} will walk you through the questions we&apos;d normally ask, and write up
                  your brief from the conversation.
                </p>
              </div>
            )}
          </>
        )}

        <div className="flex flex-col gap-2.5">
          <div>
            <p className="text-sm font-medium text-gray-300">Pick a time</p>
            {profile.weeklyAvailability.length > 0 && (
              <p className="mt-0.5 text-xs text-gray-500">
                {expertUser.firstName} takes calls on {describeAvailability(profile.weeklyAvailability)}.
              </p>
            )}
          </div>
          {slots === undefined ? (
            <Skeleton className="h-64 w-full" />
          ) : slots.some((s) => !s.taken) ? (
            <AvailabilityCalendar slots={slots} selected={slot} onSelect={setSlot} />
          ) : (
            <p className="text-sm text-gray-500">
              No times available in the next four weeks. Message {expertUser.firstName} to ask about later
              dates.
            </p>
          )}
        </div>
      </Card>

      {error && (
        <ErrorState
          whatHappened={error}
          dataSafe="No booking was created — nothing was lost."
        />
      )}

      <Button
        size="lg"
        className="w-full justify-center"
        disabled={!canBook}
        loading={booking}
        onClick={confirmBooking}
      >
        {isImplementation ? "Confirm session" : "Confirm consultation"}
      </Button>
    </div>
  );
}
