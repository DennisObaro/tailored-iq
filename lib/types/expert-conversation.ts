/**
 * The communication layer around one client↔expert engagement.
 *
 * Distinct from `Conversation` in ./conversation.ts, which is the client's
 * diagnosis chat with TailoredIQ itself — that one is client-to-AI, one per
 * project, and its messages carry an "ai" role. This is two named people
 * talking about a specific challenge, so it needs sender identity, read
 * state and attachments that the diagnosis chat has no use for.
 */
export type ConversationSenderRole = "client" | "expert" | "system";

/**
 * A file shared into a thread. Metadata only — there is no file storage in
 * this prototype, so the record describes the document without pretending to
 * hold it. A real backend fills in a storage key and the UI stops saying
 * "preview unavailable".
 */
export interface MessageAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  /** Empty for `system` — TailoredIQ speaking, not a person. */
  senderId: string;
  senderRole: ConversationSenderRole;
  content: string;
  attachments: MessageAttachment[];
  /** Set when the other party has seen it. Two participants, so one field is enough. */
  readAt?: string;
  createdAt: string;
}

/**
 * Stored state is only ever `active` or `archived`. Whether a consultation
 * is scheduled or done is the consultation's business, and is derived when
 * the thread is read rather than copied here — the same reason
 * `engagementStage` derives an opportunity's stage from its project.
 */
export type ExpertConversationStatus = "active" | "archived";

/** What the thread is showing right now, consultation included. */
export type ExpertConversationStage =
  | "active"
  | "consultation_scheduled"
  | "consultation_completed"
  | "archived";

export interface ExpertConversation {
  id: string;
  clientId: string;
  expertId: string;
  /** The challenge. A thread is always about something — never a bare DM. */
  projectId: string;
  consultationId?: string;
  playbookId?: string;
  status: ExpertConversationStatus;
  createdAt: string;
  updatedAt: string;
}
