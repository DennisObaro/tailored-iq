import type { Conversation } from "@/lib/types";
import { simulateNetwork, ApiError } from "./client";
import { db } from "./_db";
import { id } from "@/lib/utils/id";
import { getNextAiMessage } from "@/lib/ai-sim/chat-responder";

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  return simulateNetwork(() => db.get().conversations.find((c) => c.id === conversationId) ?? null, {
    latency: [100, 200],
  });
}

export async function getConversationByProject(projectId: string): Promise<Conversation | null> {
  return simulateNetwork(
    () => db.get().conversations.find((c) => c.projectId === projectId) ?? null,
    { latency: [100, 200] },
  );
}

export async function postMessage(conversationId: string, content: string): Promise<Conversation> {
  return simulateNetwork(
    () =>
      db.update((d) => {
        const conversation = d.conversations.find((c) => c.id === conversationId);
        if (!conversation) throw new ApiError("Conversation not found.", "NOT_FOUND");
        const now = new Date().toISOString();
        conversation.messages.push({ id: id("msg"), role: "user", content, createdAt: now });

        const { content: aiContent, isComplete } = getNextAiMessage(conversation.turnCount);
        conversation.messages.push({ id: id("msg"), role: "ai", content: aiContent, createdAt: now });
        conversation.turnCount += 1;

        if (isComplete) {
          conversation.status = "complete";
          conversation.endedAt = now;
        }
        return conversation;
      }),
    { latency: [900, 1800] },
  );
}
