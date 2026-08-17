"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "@/components/icons";
import type { Project } from "@/lib/types";
import * as expertsApi from "@/lib/api/experts";
import type { ExpertListing } from "@/lib/api/experts";
import * as projectsApi from "@/lib/api/projects";
import * as consultationsApi from "@/lib/api/consultations";
import { useSessionStore } from "@/lib/store/use-session-store";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { SlotPicker } from "@/components/booking/slot-picker";

export default function BookConsultationPage() {
  const { expertId } = useParams<{ expertId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useSessionStore((s) => s.user);

  const [listing, setListing] = useState<ExpertListing | null | undefined>(undefined);
  const [eligibleProjects, setEligibleProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(searchParams.get("projectId") ?? "");
  const [slot, setSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    expertsApi.getExpert(expertId).then(setListing);
  }, [expertId]);

  useEffect(() => {
    if (!user) return;
    projectsApi.listProjects(user.id).then((projects) => {
      const eligible = projects.filter((p) => !p.consultationId);
      setEligibleProjects(eligible);
      if (!projectId && eligible.length > 0) setProjectId(eligible[0].id);
    });
  }, [user, projectId]);

  async function confirmBooking() {
    if (!user || !slot || !projectId) return;
    setBooking(true);
    setError(false);
    try {
      const consultation = await consultationsApi.bookConsultation({
        projectId,
        clientId: user.id,
        expertId,
        scheduledFor: slot,
      });
      router.push(`/consultations/${consultation.id}`);
    } catch {
      setError(true);
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
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-300" htmlFor="project">
            Which challenge is this for?
          </label>
          <Select id="project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {eligibleProjects.length === 0 && <option value="">No eligible projects</option>}
            {eligibleProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-gray-300">Pick a time</p>
          {profile.availabilitySlots.length === 0 ? (
            <p className="text-sm text-gray-500">No availability listed right now.</p>
          ) : (
            <SlotPicker slots={profile.availabilitySlots} selected={slot} onSelect={setSlot} />
          )}
        </div>
      </Card>

      {error && (
        <ErrorState
          whatHappened="We couldn't confirm this booking."
          dataSafe="No booking was created — nothing was lost."
          onRetry={confirmBooking}
        />
      )}

      <Button
        size="lg"
        className="w-full justify-center"
        disabled={!slot || !projectId}
        loading={booking}
        onClick={confirmBooking}
      >
        Confirm consultation
      </Button>
    </div>
  );
}
