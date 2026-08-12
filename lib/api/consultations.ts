import type { Consultation, Review, User } from "@/lib/types";
import { simulateNetwork, simulateGeneration, ApiError } from "./client";
import { db } from "./_db";
import { id } from "@/lib/utils/id";
import { generateTranscript } from "@/lib/ai-sim/transcript-generator";

export async function getConsultation(consultationId: string): Promise<Consultation | null> {
  return simulateNetwork(() => db.get().consultations.find((c) => c.id === consultationId) ?? null, {
    latency: [100, 200],
  });
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
