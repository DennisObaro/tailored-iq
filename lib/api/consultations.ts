import type { Consultation, ExpertWillingness, Review, User } from "@/lib/types";
import { simulateNetwork, simulateGeneration, ApiError } from "./client";
import { db } from "./_db";
import { id } from "@/lib/utils/id";
import { generateTranscript } from "@/lib/ai-sim/transcript-generator";
import { getExpertAccess } from "@/lib/utils/expert-access";
import { awardPointsWithin } from "./expert-points";

/**
 * Transcripts are the most sensitive thing in a project, so a consultation
 * is only ever readable by its two participants (spec §30).
 */
export async function getConsultation(consultationId: string, viewerId?: string): Promise<Consultation | null> {
  return simulateNetwork(
    () => {
      const consultation = db.get().consultations.find((c) => c.id === consultationId) ?? null;
      if (!consultation) return null;
      if (viewerId && consultation.clientId !== viewerId && consultation.expertId !== viewerId) return null;
      return consultation;
    },
    { latency: [100, 200] },
  );
}

export async function listConsultationsForClient(clientId: string): Promise<Consultation[]> {
  return simulateNetwork(
    () =>
      db
        .get()
        .consultations.filter((c) => c.clientId === clientId)
        .sort((a, b) => (a.scheduledFor < b.scheduledFor ? -1 : 1)),
    { latency: [120, 250] },
  );
}

export async function listConsultationsForExpert(expertId: string): Promise<Consultation[]> {
  return simulateNetwork(
    () =>
      db
        .get()
        .consultations.filter((c) => c.expertId === expertId)
        .sort((a, b) => (a.scheduledFor < b.scheduledFor ? -1 : 1)),
    { latency: [120, 250] },
  );
}

export async function bookConsultation(input: {
  projectId: string;
  clientId: string;
  expertId: string;
  scheduledFor: string;
}): Promise<Consultation> {
  return simulateNetwork(() =>
    db.update((d) => {
      const project = d.projects.find((p) => p.id === input.projectId);
      if (!project) throw new ApiError("Project not found.", "NOT_FOUND");

      const now = new Date().toISOString();
      const consultation: Consultation = {
        id: id("consultation"),
        projectId: input.projectId,
        clientId: input.clientId,
        expertId: input.expertId,
        scheduledFor: input.scheduledFor,
        status: "scheduled",
        recordingConsent: true,
        createdAt: now,
      };
      d.consultations.push(consultation);

      project.consultationId = consultation.id;
      project.status = "consultation_scheduled";
      project.updatedAt = now;
      project.activity.push({ id: id("act"), label: "Consultation scheduled", timestamp: now });
      d.notifications.unshift({
        id: id("notif"),
        userId: project.clientId,
        type: "booking_confirmed",
        title: "Consultation confirmed",
        body: `Your consultation for "${project.title}" is scheduled.`,
        linkHref: `/consultations/${consultation.id}`,
        read: false,
        createdAt: now,
      });

      return consultation;
    }),
  );
}

export async function startCall(consultationId: string): Promise<Consultation> {
  return simulateNetwork(
    () =>
      db.update((d) => {
        const consultation = d.consultations.find((c) => c.id === consultationId);
        if (!consultation) throw new ApiError("Consultation not found.", "NOT_FOUND");

        /**
         * An expert whose approval has lapsed (restricted, suspended) must
         * not be able to join a client call, even one booked earlier.
         */
        const profile = d.expertProfiles.find((p) => p.userId === consultation.expertId);
        const access = getExpertAccess(profile);
        if (!access.canJoinCalls) {
          throw new ApiError(
            "This expert isn't currently available for client calls.",
            "EXPERT_UNAVAILABLE",
          );
        }

        consultation.status = "in_call";
        return consultation;
      }),
    { latency: [200, 400] },
  );
}

export async function endCall(consultationId: string): Promise<Consultation> {
  return simulateGeneration(() =>
    db.update((d) => {
      const consultation = d.consultations.find((c) => c.id === consultationId);
      if (!consultation) throw new ApiError("Consultation not found.", "NOT_FOUND");
      const project = d.projects.find((p) => p.id === consultation.projectId);
      if (!project) throw new ApiError("Project not found.", "NOT_FOUND");
      const expert = d.users.find((u) => u.id === consultation.expertId);

      const { transcript, extractedInsights, durationSeconds } = generateTranscript({
        expertFirstName: expert?.firstName ?? "Your expert",
        challenge: project.challenge,
        category: project.category,
      });

      const now = new Date().toISOString();
      consultation.status = "completed";
      consultation.transcript = transcript;
      consultation.extractedInsights = extractedInsights;
      consultation.durationSeconds = durationSeconds;

      project.status = "consultation_completed";
      project.updatedAt = now;
      project.activity.push({ id: id("act"), label: "Consultation completed", timestamp: now });

      const expertProfile = d.expertProfiles.find((p) => p.userId === consultation.expertId);
      if (expertProfile) {
        expertProfile.totalProjects += 1;
        awardPointsWithin(d, {
          expertId: consultation.expertId,
          source: "client_consultation",
          note: `Consultation completed: ${project.title}`,
        });
      }

      return consultation;
    }),
  );
}

export async function submitReview(review: Omit<Review, "id" | "createdAt">): Promise<Review> {
  return simulateNetwork(() =>
    db.update((d) => {
      const record: Review = { ...review, id: id("review"), createdAt: new Date().toISOString() };
      d.reviews.push(record);
      return record;
    }),
  );
}

export async function getReviewForConsultation(consultationId: string): Promise<Review | null> {
  return simulateNetwork(
    () => db.get().reviews.find((r) => r.consultationId === consultationId) ?? null,
    { latency: [60, 120] },
  );
}

export interface ReviewListing {
  review: Review;
  reviewer: User;
}

export async function listReviewsForExpert(expertId: string): Promise<ReviewListing[]> {
  return simulateNetwork(
    () => {
      const database = db.get();
      return database.reviews
        .filter((r) => r.toUserId === expertId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .map((review) => {
          const reviewer = database.users.find((u) => u.id === review.fromUserId);
          return reviewer ? { review, reviewer } : null;
        })
        .filter((x): x is ReviewListing => x !== null);
    },
    { latency: [100, 200] },
  );
}

/**
 * The expert's own follow-up after a call (spec §19). Recorded against the
 * consultation and surfaced to the client on the project, so "I could help
 * further" is an offer they can act on rather than a note nobody sees.
 */
export async function expressFollowUpInterest(
  consultationId: string,
  supportTypes: ExpertWillingness[],
  note: string,
): Promise<Consultation> {
  return simulateNetwork(() =>
    db.update((d) => {
      const consultation = d.consultations.find((c) => c.id === consultationId);
      if (!consultation) throw new ApiError("Consultation not found.", "NOT_FOUND");
      if (consultation.status !== "completed") {
        throw new ApiError("You can only do this after the call has finished.", "INVALID_STATE");
      }
      if (supportTypes.length === 0) {
        throw new ApiError("Pick at least one way you could support this project.", "VALIDATION");
      }

      const now = new Date().toISOString();
      consultation.expertFollowUp = { supportTypes, note: note.trim(), createdAt: now };

      const project = d.projects.find((p) => p.id === consultation.projectId);
      const expert = d.users.find((u) => u.id === consultation.expertId);
      if (project) {
        d.notifications.unshift({
          id: id("notif"),
          userId: project.clientId,
          type: "contribution_added",
          title: "Your expert offered further support",
          body: `${expert ? expert.firstName : "Your expert"} is interested in supporting "${project.title}" further.`,
          linkHref: `/projects/${project.id}`,
          read: false,
          createdAt: now,
        });
      }

      return consultation;
    }),
  );
}

/**
 * The knowledge loop after a call (spec §20): what was discussed, what we
 * pulled out of it, and what can be done with it — rather than a raw
 * transcript dumped on the dashboard.
 */
export interface ConsultationSummary {
  consultation: Consultation;
  headline: string;
  insights: string[];
  transcriptLineCount: number;
  canFeedPlaybook: boolean;
  playbookId?: string;
}

export async function getConsultationSummary(consultationId: string): Promise<ConsultationSummary | null> {
  return simulateNetwork(
    () => {
      const database = db.get();
      const consultation = database.consultations.find((c) => c.id === consultationId);
      if (!consultation) return null;
      const project = database.projects.find((p) => p.id === consultation.projectId);

      return {
        consultation,
        headline: project
          ? `What came out of the conversation on "${project.title}"`
          : "What came out of the conversation",
        insights: consultation.extractedInsights ?? [],
        transcriptLineCount: consultation.transcript?.length ?? 0,
        canFeedPlaybook: consultation.status === "completed" && !!project,
        playbookId: project?.playbookId,
      };
    },
    { latency: [120, 250] },
  );
}
