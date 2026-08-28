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

/**
 * What the AI says when a client ends the diagnosis early via the escape
 * hatch, rather than answering all five questions. Deliberately not WRAP_UP:
 * "I think I have enough" is a claim the script hasn't earned after one or
 * two answers, where this happens most — this owns the gap instead of
 * papering over it.
 */
const EARLY_EXIT = "Got it — let's work with what you've shared so far and put together your report.";

export const CONVERSATION_TURN_LIMIT = QUESTIONS.length;

/**
 * Four short canned answers per question, offered as one-tap replies for
 * users in a hurry. Same positional indexing as QUESTIONS/DIAGNOSTIC_QUESTIONS.
 */
const SUGGESTED_REPLIES: string[][] = [
  [
    "It's a recurring pattern, not a one-off.",
    "It happened again just last month.",
    "It shows up almost every week in some form.",
    "It's more of a slow build-up than a single incident.",
  ],
  [
    "We haven't tried anything formal yet.",
    "We made some internal changes, but they didn't stick.",
    "We brought in outside help before, without much luck.",
    "We've mostly just worked around it.",
  ],
  [
    "I can change process and workflow, not budget or headcount.",
    "I have full authority to act on this.",
    "I can recommend changes, but sign-off sits above me.",
    "I can move small things, but structural change needs leadership buy-in.",
  ],
  [
    "Budget is tight right now.",
    "We're short on team capacity more than budget.",
    "Time is the real constraint — we need this resolved soon.",
    "No major constraints — we have room to act.",
  ],
  [
    "The problem stops recurring.",
    "We have a clear process in place that the team trusts.",
    "We see it reflected in the numbers.",
    "Leadership stops having to think about this at all.",
  ],
];

/**
 * A question is never itself the end of the conversation — the diagnosis
 * completes once the last question has been *answered*, which is the
 * turnCount >= length branch above. Ending on the last question instead
 * left the fifth one unanswerable (the composer disables on "complete"),
 * made WRAP_UP unreachable, and starved generateBrief of the sixth user
 * message it destructures, so desiredOutcome always fell back.
 */
export function getNextAiMessage(turnCount: number): { content: string; isComplete: boolean } {
  if (turnCount >= QUESTIONS.length) {
    return { content: WRAP_UP, isComplete: true };
  }
  return { content: QUESTIONS[turnCount], isComplete: false };
}

export function getSuggestedReplies(turnCount: number): string[] {
  return SUGGESTED_REPLIES[turnCount] ?? [];
}

export function getEarlyExitMessage(): string {
  return EARLY_EXIT;
}
