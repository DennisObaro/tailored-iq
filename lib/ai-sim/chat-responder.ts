/**
 * Canned diagnostic-question tree. Selection is driven purely by turn
 * count — this is what a real lib/api/conversations.ts implementation
 * would swap for an actual LLM call, without changing its call signature.
 */

/**
 * The five questions themselves, standalone. An expert running a client
 * intake reads this list rather than the chat transcript, so the question
 * has to survive being lifted out of the conversation around it.
 *
 * Order is load-bearing: lib/ai-sim/brief-generator.ts reads the answers
 * positionally, so situation → existing actions → authority → constraints →
 * desired outcome is the sequence a Brief is assembled from either way.
 */
export const DIAGNOSTIC_QUESTIONS = [
  "When this shows up day to day, what does it actually look like — walk me through a recent example.",
  "What have you already tried to address this?",
  "What can you actually change here — and what's outside your authority to touch?",
  "Are there any real constraints I should know about — budget, time, or team capacity?",
  "If this goes well, what does success actually look like in a few months?",
];

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** The same script with the conversational glue the chat says them with. */
const QUESTIONS = DIAGNOSTIC_QUESTIONS.map((q, i) => {
  if (i === 0) return `Got it. ${q}`;
  if (i === DIAGNOSTIC_QUESTIONS.length - 1) return `Last one — ${lowerFirst(q)}`;
  return q;
});

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
