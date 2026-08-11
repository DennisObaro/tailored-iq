/**
 * Canned diagnostic-question tree. Selection is driven purely by turn
 * count — this is what a real lib/api/conversations.ts implementation
 * would swap for an actual LLM call, without changing its call signature.
 */

const QUESTIONS = [
  "Got it. When this shows up day to day, what does it actually look like — walk me through a recent example.",
  "What have you already tried to address this?",
  "What can you actually change here — and what's outside your authority to touch?",
  "Are there any real constraints I should know about — budget, time, or team capacity?",
  "Last one — if this goes well, what does success actually look like in a few months?",
];

const WRAP_UP =
  "Thanks, that's helpful. I think I have enough to put together a structured brief for you.";

export const CONVERSATION_TURN_LIMIT = QUESTIONS.length;

export function getNextAiMessage(turnCount: number): { content: string; isComplete: boolean } {
  if (turnCount >= QUESTIONS.length) {
    return { content: WRAP_UP, isComplete: true };
  }
  const isLastQuestion = turnCount === QUESTIONS.length - 1;
  return { content: QUESTIONS[turnCount], isComplete: isLastQuestion };
}
