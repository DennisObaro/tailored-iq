import type { Consultation, ExpertWillingness, Project, Review, User } from "@/lib/types";
import { simulateNetwork, simulateGeneration, ApiError } from "./client";
import { db, type Database } from "./_db";
import { createProjectWithin } from "./projects";
import { id } from "@/lib/utils/id";
import { formatCallWhen } from "@/lib/utils/format";
import { getOrCreateConversationWithin, postSystemMessageWithin } from "./expert-conversations";
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

/**
 * The expert's side of a cold booking. Unlike a broadcast opportunity there
 * is nothing here to opt into — the client chose this expert by name — so it
 * lands already `interested`, with no requested contributions to pick from.
 */
function createIntakeOpportunityWithin(d: Database, project: Project, expertId: string, now: string) {
  const alreadyOffered = d.opportunities.some(
    (o) => o.projectId === project.id && o.expertId === expertId,
  );
  if (alreadyOffered) return;

  const opportunityId = id("opportunity");
  d.opportunities.unshift({
    id: opportunityId,
    projectId: project.id,
    expertId,
    kind: "direct_intake",
    title: project.title,
    summary: project.challenge,
    relevanceReason: "This client came to you directly and booked a call with you.",
    category: project.category ?? "Strategy",
    requestedContributions: [],
    response: "interested",
    offeredContributions: [],
    respondedAt: now,
    createdAt: now,
  });
  d.notifications.unshift({
    id: id("notif"),
    userId: expertId,
    type: "opportunity_new",
    title: "A client booked you directly",
    body: "They haven't defined their challenge yet — you'll build the brief together on the call.",
    linkHref: `/expert/opportunities/${opportunityId}`,
    read: false,
    createdAt: now,
  });
}

/**
 * Booking a call. Either against a challenge the client has already
 * diagnosed (`projectId`), or cold (`newChallenge`) — a client who went
 * straight to an expert rather than through the chat.
 *
 * The cold path is what creates a direct intake: it mints the project the
 * consultation needs, keeps it off the live-brief broadcast because an
 * expert has already been chosen, and gives that expert an opportunity whose
 * work is running the conversation and completing the brief.
 */
export async function bookConsultation(input: {
  projectId?: string;
  /** A one-line description of the challenge, when there's no project yet. */
  newChallenge?: string;
  clientId: string;
  expertId: string;
  scheduledFor: string;
}): Promise<{ consultation: Consultation; conversationId: string }> {
  return simulateNetwork(() =>
    db.update((d) => {
      const now = new Date().toISOString();

      const project = input.projectId
        ? d.projects.find((p) => p.id === input.projectId)
        : input.newChallenge?.trim()
          ? createProjectWithin(d, input.clientId, input.newChallenge.trim(), { broadcast: false }).project
          : undefined;
      if (!project) throw new ApiError("Project not found.", "NOT_FOUND");

      /**
       * The booked expert is engaged on this project from the moment it's
       * booked — canViewProject keys off matchedExpertIds, so without this
       * they could join the call without being able to read the brief they
       * are supposed to be discussing.
       */
      if (!project.matchedExpertIds.includes(input.expertId)) {
        project.matchedExpertIds.push(input.expertId);
      }

      if (input.newChallenge) {
        createIntakeOpportunityWithin(d, project, input.expertId, now);
      }
      const consultation: Consultation = {
        id: id("consultation"),
        projectId: project.id,
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
      /**
       * Booking is the moment a client actually engages this expert, so it's
       * where their private thread begins — created here rather than left to
       * the client to start, because the two of them now have a call to
       * prepare for and somewhere to do it.
       */
      const conversation = getOrCreateConversationWithin(d, {
        clientId: input.clientId,
        expertId: input.expertId,
        projectId: project.id,
      });
      conversation.consultationId = consultation.id;
      conversation.updatedAt = now;
      postSystemMessageWithin(
        d,
        conversation.id,
        `Consultation scheduled — ${formatCallWhen(consultation.scheduledFor)}`,
      );

      d.notifications.unshift({
        id: id("notif"),
        userId: project.clientId,
        type: "booking_confirmed",
        title: "Consultation confirmed",
        body: `Your consultation for "${project.title}" is scheduled.`,
        linkHref: `/conversations/${conversation.id}`,
        read: false,
        createdAt: now,
      });

      /**
       * The expert was never told a booking had happened — they only found
       * out by checking Calls. Same notification system, pointed at the
       * conversation so they land where the context is.
       */
      const client = d.users.find((u) => u.id === input.clientId);
      d.notifications.unshift({
        id: id("notif"),
        userId: input.expertId,
        type: "booking_confirmed",
        title: "Consultation booked",
        body: `${client ? client.firstName : "A client"} booked a consultation about "${project.title}".`,
        linkHref: `/conversations/${conversation.id}`,
        read: false,
        createdAt: now,
      });

      return { consultation, conversationId: conversation.id };
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
