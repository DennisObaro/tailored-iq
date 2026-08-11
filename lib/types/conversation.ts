export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  createdAt: string;
}

export type ConversationType = "diagnosis" | "expert_thread";

export interface Conversation {
  id: string;
  projectId: string;
  type: ConversationType;
  participantIds: string[];
  messages: ChatMessage[];
  turnCount: number;
  status: "in_progress" | "complete";
  startedAt: string;
  endedAt?: string;
}
