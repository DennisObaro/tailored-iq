// lib/api/engagements.ts
import type { Engagement, EngagementReview, MessageAttachment, Playbook, User, ExpertProfile } from "@/lib/types";
import { simulateNetwork } from "./client";
import { db, type Database } from "./_db";
import { canViewEngagement } from "./_access";
import { getOrCreateConversationWithin } from "./expert-conversations";
import { id } from "@/lib/utils/id";

/**
 * One engagement per (client, expert, playbook) — repeat bookings with the
 * same expert on the same playbook accumulate onto the one engagement
 * rather than forking it, the same identity rule ExpertConversation uses
 * for (client, expert, project). Called from inside an existing
 * db.update() — see bookImplementationConsultation.
 */
export function getOrCreateEngagementWithin(
  d: Database,
  input: { clientId: string; expertId: string; playbookId: string; projectId: string },
): Engagement {
  const existing = d.engagements.find(
    (e) => e.clientId === input.clientId && e.expertId === input.expertId && e.playbookId === input.playbookId,
  );
  if (existing) return existing;

  const conversation = getOrCreateConversationWithin(d, {
    clientId: input.clientId,
    expertId: input.expertId,
    projectId: input.projectId,
  });

  const now = new Date().toISOString();
  const engagement: Engagement = {
    id: id("engagement"),
    clientId: input.clientId,
    expertId: input.expertId,
    playbookId: input.playbookId,
    projectId: input.projectId,
    conversationId: conversation.id,
    status: "in_progress",
    createdAt: now,
    updatedAt: now,
  };
  d.engagements.push(engagement);
  return engagement;
}

export interface EngagementListing {
  engagement: Engagement;
  counterpart: User;
  /** Present when the viewer is the client — the expert's headline for the row. */
  counterpartProfile?: ExpertProfile;
  playbookTitle: string;
  myReview?: EngagementReview;
  otherReview?: EngagementReview;
}

function toListing(d: Database, engagement: Engagement, viewerId: string): EngagementListing | null {
  const isClient = engagement.clientId === viewerId;
  const counterpartId = isClient ? engagement.expertId : engagement.clientId;
  const counterpart = d.users.find((u) => u.id === counterpartId);
  const playbook = d.playbooks.find((p) => p.id === engagement.playbookId);
  if (!counterpart || !playbook) return null;

  const reviews = d.engagementReviews.filter((r) => r.engagementId === engagement.id);
  return {
    engagement,
    counterpart,
    counterpartProfile: isClient ? d.expertProfiles.find((p) => p.userId === counterpartId) : undefined,
    playbookTitle: playbook.title,
    myReview: reviews.find((r) => r.fromUserId === viewerId),
    otherReview: reviews.find((r) => r.fromUserId !== viewerId),
  };
}

export async function listEngagementsForClient(clientId: string): Promise<EngagementListing[]> {
  return simulateNetwork(
    () => {
      const d = db.get();
      return d.engagements
        .filter((e) => e.clientId === clientId)
        .map((e) => toListing(d, e, clientId))
        .filter((x): x is EngagementListing => x !== null)
        .sort((a, b) => (a.engagement.updatedAt < b.engagement.updatedAt ? 1 : -1));
    },
    { latency: [120, 250] },
  );
}

export async function listEngagementsForExpert(expertId: string): Promise<EngagementListing[]> {
  return simulateNetwork(
    () => {
      const d = db.get();
      return d.engagements
        .filter((e) => e.expertId === expertId)
        .map((e) => toListing(d, e, expertId))
        .filter((x): x is EngagementListing => x !== null)
        .sort((a, b) => (a.engagement.updatedAt < b.engagement.updatedAt ? 1 : -1));
    },
    { latency: [120, 250] },
  );
}

export interface EngagementDetail {
  engagement: Engagement;
  counterpart: User;
  counterpartProfile?: ExpertProfile;
  playbook: Pick<Playbook, "id" | "title">;
  viewerRole: "client" | "expert";
  myReview?: EngagementReview;
  otherReview?: EngagementReview;
}

/** The engagement, or null for anyone who isn't one of its two people. */
export async function getEngagement(engagementId: string, viewerId: string): Promise<EngagementDetail | null> {
  return simulateNetwork(
    () => {
      const d = db.get();
      if (!canViewEngagement(d, engagementId, viewerId)) return null;
      const engagement = d.engagements.find((e) => e.id === engagementId);
      if (!engagement) return null;
      const listing = toListing(d, engagement, viewerId);
      if (!listing) return null;
      const playbook = d.playbooks.find((p) => p.id === engagement.playbookId)!;

      return {
        engagement,
        counterpart: listing.counterpart,
        counterpartProfile: listing.counterpartProfile,
        playbook: { id: playbook.id, title: playbook.title },
        viewerRole: engagement.clientId === viewerId ? "client" : "expert",
        myReview: listing.myReview,
        otherReview: listing.otherReview,
      };
    },
    { latency: [100, 220] },
  );
}

export interface EngagementAttachment {
  attachment: MessageAttachment;
  messageId: string;
  createdAt: string;
}

/** Every file shared in the engagement's chat, flattened. No separate storage — same MessageAttachment records the thread already carries. */
export async function listAttachmentsForEngagement(
  engagementId: string,
  viewerId: string,
): Promise<EngagementAttachment[]> {
  return simulateNetwork(
    () => {
      const d = db.get();
      if (!canViewEngagement(d, engagementId, viewerId)) return [];
      const engagement = d.engagements.find((e) => e.id === engagementId);
      if (!engagement) return [];

      const messages = d.conversationMessages.filter((m) => m.conversationId === engagement.conversationId);
      const out: EngagementAttachment[] = [];
      for (const message of messages) {
        for (const attachment of message.attachments) {
          out.push({ attachment, messageId: message.id, createdAt: message.createdAt });
        }
      }
      return out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
    { latency: [100, 200] },
  );
}
