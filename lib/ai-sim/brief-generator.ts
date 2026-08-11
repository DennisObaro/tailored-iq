import type { Conversation, Brief } from "@/lib/types";

export type GeneratedBrief = Omit<Brief, "id" | "createdAt" | "updatedAt" | "category">;

export function generateBrief(conversation: Conversation, projectId: string): GeneratedBrief {
  const userMessages = conversation.messages.filter((m) => m.role === "user").map((m) => m.content);
  const [challenge, situationDetail, existingActions, authority, constraints, desiredOutcome] = userMessages;

  return {
    projectId,
    situation: [challenge, situationDetail].filter(Boolean).join(" "),
    objective: challenge ?? "",
    constraints: constraints || "No specific constraints identified yet — worth clarifying before acting.",
    authority: authority || "To be clarified with the team.",
    existingActions: existingActions || "Nothing has been tried yet.",
    desiredOutcome: desiredOutcome || "To be defined more specifically.",
    secondaryCategories: [],
    confirmed: false,
  };
}
