/** Roughly the two lines the notification banner has room for. */
const MAX_LENGTH = 96;

/**
 * Shortens a client's first message to the thing they're actually asking.
 *
 * People describe the situation before they ask the question — "we grew from
 * 40 to 180 people... how should we restructure the leadership team?" — so
 * the last sentence ending in a question mark is nearly always the ask, and
 * the sentences before it are context the expert can read on expand. A
 * message that's already short is left exactly as written.
 */
export function abridgeQuestion(question: string): string {
  const text = question.trim().replace(/\s+/g, " ");
  if (text.length <= MAX_LENGTH) return text;

  const sentences = (text.match(/[^.!?]+[.!?]*/g) ?? [text]).map((s) => s.trim()).filter(Boolean);
  const asked = [...sentences].reverse().find((s) => s.endsWith("?"));
  const candidate = asked ?? sentences[sentences.length - 1] ?? text;
  if (candidate.length <= MAX_LENGTH) return candidate;

  // Still long: cut at a word boundary rather than mid-word.
  return `${candidate.slice(0, MAX_LENGTH).replace(/[\s,;:]+\S*$/, "")}…`;
}
