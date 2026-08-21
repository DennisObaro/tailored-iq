import type {
  ConversationMessage,
  Consultation,
  ExpertConversation,
  ExpertConversationStage,
  ExpertProfile,
  MessageAttachment,
  Project,
  User,
} from "@/lib/types";
import { simulateNetwork, ApiError } from "./client";
import { db, type Database } from "./_db";
import { canViewExpertConversation } from "./_access";
import { id } from "@/lib/utils/id";

/** A row in either inbox. `counterpart` is whoever the viewer isn't. */
export interface ConversationListing {
  conversation: ExpertConversation;
  counterpart: User;
  /** Present when the viewer is the client — the expert's headline for the row. */
  counterpartProfile?: ExpertProfile;
  projectTitle: string;
  stage: ExpertConversationStage;
  lastMessage?: ConversationMessage;
  unreadCount: number;
}

/** Everything the thread screen needs, in one authorised read. */
export interface ConversationThread {
  conversation: ExpertConversation;
  counterpart: User;
  counterpartProfile?: ExpertProfile;
  messages: ConversationMessage[];
  stage: ExpertConversationStage;
  /** The challenge, so neither side has to guess why they're talking. */
  project: Pick<Project, "id" | "title" | "challenge" | "category" | "status">;
  consultation?: Consultation;
  viewerRole: "client" | "expert";
}

function stageFor(d: Database, conversation: ExpertConversation): ExpertConversationStage {
  if (conversation.status === "archived") return "archived";
  const consultation = conversation.consultationId
    ? d.consultations.find((c) => c.id === conversation.consultationId)
    : undefined;
  if (!consultation) return "active";
  if (consultation.status === "completed") return "consultation_completed";
  if (consultation.status === "cancelled") return "active";
  return "consultation_scheduled";
}

function messagesIn(d: Database, conversationId: string) {
  return d.conversationMessages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

/**
 * The same get-or-create, for callers already inside a db.update.
 * Booking uses it so the consultation and its conversation are one write.
 */
export function getOrCreateConversationWithin(
  d: Database,
  input: { clientId: string; expertId: string; projectId: string },
): ExpertConversation {
  const existing = d.expertConversations.find(
    (c) =>
      c.clientId === input.clientId && c.expertId === input.expertId && c.projectId === input.projectId,
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const conversation: ExpertConversation = {
    id: id("conversation_thread"),
    clientId: input.clientId,
    expertId: input.expertId,
    projectId: input.projectId,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  d.expertConversations.push(conversation);
  return conversation;
}

/**
 * Opens the thread for this client, expert and challenge, creating it only
 * if it doesn't exist. The triple is the identity: the same pair talking
 * about a second challenge get a second thread, and clicking "Message"
 * twice on the same one never forks the history.
 */
export async function getOrCreateConversation(input: {
  clientId: string;
  expertId: string;
  projectId: string;
}): Promise<ExpertConversation> {
  return simulateNetwork(() =>
    db.update((d) => {
      const project = d.projects.find((p) => p.id === input.projectId);
      if (!project) throw new ApiError("Challenge not found.", "NOT_FOUND");
      if (project.clientId !== input.clientId) {
        throw new ApiError("That challenge isn't yours.", "FORBIDDEN");
      }
      const expert = d.expertProfiles.find((p) => p.userId === input.expertId);
      if (!expert || expert.verificationStatus !== "approved") {
        throw new ApiError("That expert isn't available.", "NOT_FOUND");
      }

      const existing = d.expertConversations.find(
        (c) =>
          c.clientId === input.clientId &&
          c.expertId === input.expertId &&
          c.projectId === input.projectId,
      );
      if (existing) return existing;

      const now = new Date().toISOString();
      const conversation: ExpertConversation = {
        id: id("conversation_thread"),
        clientId: input.clientId,
        expertId: input.expertId,
        projectId: input.projectId,
        status: "active",
        createdAt: now,
        updatedAt: now,
      };
      d.expertConversations.push(conversation);
      return conversation;
    }),
  );
}

/** Both inboxes come from here — the viewer's side decides who the counterpart is. */
export async function listConversationsForUser(userId: string): Promise<ConversationListing[]> {
  return simulateNetwork(
    () => {
      const database = db.get();
      return database.expertConversations
        .filter((c) => c.clientId === userId || c.expertId === userId)
        .map((conversation): ConversationListing | null => {
          const counterpartId =
            conversation.clientId === userId ? conversation.expertId : conversation.clientId;
          const counterpart = database.users.find((u) => u.id === counterpartId);
          const project = database.projects.find((p) => p.id === conversation.projectId);
          if (!counterpart || !project) return null;

          const messages = messagesIn(database, conversation.id);
          return {
            conversation,
            counterpart,
            counterpartProfile: database.expertProfiles.find((p) => p.userId === counterpartId),
            projectTitle: project.title,
            stage: stageFor(database, conversation),
            lastMessage: messages[messages.length - 1],
            unreadCount: messages.filter((m) => m.senderId !== userId && m.senderRole !== "system" && !m.readAt)
              .length,
          };
        })
        .filter((x): x is ConversationListing => x !== null)
        .sort((a, b) => {
          const at = a.lastMessage?.createdAt ?? a.conversation.updatedAt;
          const bt = b.lastMessage?.createdAt ?? b.conversation.updatedAt;
          return at < bt ? 1 : -1;
        });
    },
    { latency: [120, 260] },
  );
}

/**
 * The thread, or null for anyone who isn't one of its two people. Null
 * rather than a throw so the page renders its ordinary not-found state and
 * nothing confirms the conversation exists.
 */
export async function getConversationThread(
  conversationId: string,
  viewerId: string,
): Promise<ConversationThread | null> {
  return simulateNetwork(
    () => {
      const database = db.get();
      if (!canViewExpertConversation(database, conversationId, viewerId)) return null;

      const conversation = database.expertConversations.find((c) => c.id === conversationId);
      if (!conversation) return null;
      const project = database.projects.find((p) => p.id === conversation.projectId);
      if (!project) return null;

      const viewerRole = conversation.clientId === viewerId ? "client" : "expert";
      const counterpartId = viewerRole === "client" ? conversation.expertId : conversation.clientId;
      const counterpart = database.users.find((u) => u.id === counterpartId);
      if (!counterpart) return null;

      return {
        conversation,
        counterpart,
        counterpartProfile: database.expertProfiles.find((p) => p.userId === counterpartId),
        messages: messagesIn(database, conversationId),
        stage: stageFor(database, conversation),
        project: {
          id: project.id,
          title: project.title,
          challenge: project.challenge,
          category: project.category,
          status: project.status,
        },
        consultation: conversation.consultationId
          ? database.consultations.find((c) => c.id === conversation.consultationId)
          : undefined,
        viewerRole,
      };
    },
    { latency: [100, 220] },
  );
}

export async function sendMessage(input: {
  conversationId: string;
  senderId: string;
  content: string;
  attachments?: Omit<MessageAttachment, "id" | "uploadedBy">[];
}): Promise<ConversationMessage> {
  return simulateNetwork(() =>
    db.update((d) => {
      if (!canViewExpertConversation(d, input.conversationId, input.senderId)) {
        throw new ApiError("This conversation isn't available.", "FORBIDDEN");
      }
      const conversation = d.expertConversations.find((c) => c.id === input.conversationId)!;
      if (conversation.status === "archived") {
        throw new ApiError("This conversation has been archived.", "INVALID_STATE");
      }
      const attachments = input.attachments ?? [];
      if (!input.content.trim() && attachments.length === 0) {
        throw new ApiError("Write something first.", "VALIDATION");
      }

      const now = new Date().toISOString();
      const message: ConversationMessage = {
        id: id("message"),
        conversationId: input.conversationId,
        senderId: input.senderId,
        senderRole: conversation.clientId === input.senderId ? "client" : "expert",
        content: input.content.trim(),
        attachments: attachments.map((a) => ({ ...a, id: id("attachment"), uploadedBy: input.senderId })),
        createdAt: now,
      };
      d.conversationMessages.push(message);
      conversation.updatedAt = now;
      return message;
    }),
  );
}

/** TailoredIQ speaking into the thread — booking confirmations, call outcomes. */
export function postSystemMessageWithin(d: Database, conversationId: string, content: string) {
  const now = new Date().toISOString();
  d.conversationMessages.push({
    id: id("message"),
    conversationId,
    senderId: "",
    senderRole: "system",
    content,
    attachments: [],
    readAt: now,
    createdAt: now,
  });
}

/** Marks everything the other side sent as read. Called when the thread is opened. */
export async function markConversationRead(conversationId: string, readerId: string): Promise<void> {
  return simulateNetwork(
    () => {
      db.update((d) => {
        if (!canViewExpertConversation(d, conversationId, readerId)) return;
        const now = new Date().toISOString();
        for (const message of d.conversationMessages) {
          if (message.conversationId !== conversationId) continue;
          if (message.senderId === readerId || message.senderRole === "system") continue;
          if (!message.readAt) message.readAt = now;
        }
      });
    },
    { latency: [40, 100] },
  );
}
