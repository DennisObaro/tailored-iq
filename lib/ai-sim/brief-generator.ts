import type { Conversation, Brief } from "@/lib/types";

export type GeneratedBrief = Omit<Brief, "id" | "createdAt" | "updatedAt" | "category">;

/**
 * What the generator writes when the conversation never produced an answer.
 * Named rather than inlined because the narration below has to recognise
 * them: a field still holding its fallback is an unanswered question, and
 * that's precisely what the root cause is about.
 */
export const BRIEF_FALLBACKS = {
  constraints: "No specific constraints identified yet — worth clarifying before acting.",
  authority: "To be clarified with the team.",
  existingActions: "Nothing has been tried yet.",
  desiredOutcome: "To be defined more specifically.",
} as const;

/** Trim, collapse whitespace, capitalise, and guarantee terminal punctuation. */
function sentence(value: string): string {
  const text = value.trim().replace(/\s+/g, " ");
  if (!text) return "";
  const capitalised = text.charAt(0).toUpperCase() + text.slice(1);
  return /[.!?]$/.test(capitalised) ? capitalised : `${capitalised}.`;
}

/** The same text as a mid-sentence fragment: lowercased, no terminal stop. */
function clause(value: string): string {
  const text = value.trim().replace(/\s+/g, " ").replace(/[.!?]+$/, "");
  if (!text) return "";
  // Only lowercase a plain opening word — an acronym or a proper noun that
  // happens to start the answer should survive being moved mid-sentence.
  const [first] = text.split(" ");
  const shouldLower = first === first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  return shouldLower ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

type NarrationInput = Pick<
  Brief,
  "situation" | "objective" | "constraints" | "authority" | "existingActions" | "desiredOutcome"
>;

/**
 * Reads the structured brief back as prose.
 *
 * Two movements, matching how the card renders them: the summary restates
 * what the diagnosis heard, and the root cause names the gap behind it.
 * Framing is chosen to survive free text — answers arrive as noun phrases
 * ("A board-ready plan…") and as full clauses ("Trainees actively drive…")
 * in roughly equal measure, so every frame here ("Success means …", a
 * parenthetical, a colon) accepts both rather than assuming one shape.
 */
export function narrateBrief(brief: NarrationInput): { summary: string; rootCause: string } {
  const tried = brief.existingActions?.trim() && brief.existingActions !== BRIEF_FALLBACKS.existingActions;
  const outcomeKnown = brief.desiredOutcome?.trim() && brief.desiredOutcome !== BRIEF_FALLBACKS.desiredOutcome;

  // generateBrief builds `situation` as the opening challenge plus the first
  // answer, and `objective` as that same challenge — so restating the
  // objective would print the challenge twice, and a challenge phrased as a
  // question ("Should we enter a new market?") can't take a "the need is
  // to …" frame. Only a hand-authored objective that says something the
  // situation doesn't is worth a sentence of its own.
  const objective = brief.objective?.trim() ?? "";
  const objectiveAddsSomething =
    objective.length > 0 &&
    !brief.situation?.toLowerCase().includes(objective.toLowerCase().replace(/[.!?]+$/, ""));

  const summary = [
    sentence(brief.situation),
    // Colon-framed because this answer arrives in both shapes: a thing tried
    // ("One joint offsite…") and a statement that nothing was ("We haven't
    // tried anything formal yet") — no single verb frame fits both.
    tried
      ? `What's been tried so far: ${sentence(brief.existingActions)}`
      : "Nothing has been tried against it yet, so the approach is still open.",
    // Colon-framed for the same reason as the line above: a hand-authored
    // objective is verb-initial ("Build alignment across…") but a generated
    // one is the client's own opening line, which can be a statement or a
    // question — "the need is to should we enter a new market" is the shape
    // that breaks, and it appears as soon as an edit makes this non-redundant.
    objectiveAddsSomething ? `The immediate need: ${sentence(objective)}` : "",
    outcomeKnown ? `Success means ${clause(brief.desiredOutcome)}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  // A field still carrying its fallback is a question the diagnosis asked
  // and never got an answer to — that absence *is* the root cause, and it's
  // more useful to say so than to invent an analysis over missing facts.
  const gaps: string[] = [];
  if (!brief.constraints?.trim() || brief.constraints === BRIEF_FALLBACKS.constraints) {
    gaps.push("the real limits on budget, time, and capacity");
  }
  if (!brief.authority?.trim() || brief.authority === BRIEF_FALLBACKS.authority) {
    gaps.push("how much you can change without escalating");
  }
  if (!outcomeKnown) {
    gaps.push("what a good outcome measurably looks like");
  }

  /**
   * The non-gap phrasing deliberately says nothing about what was attempted.
   * `existingActions` is free text, and an answer to "what have you tried"
   * arrives as readily in the negative ("We haven't tried anything formal
   * yet") as in the positive — with no real language model here, asserting
   * that an attempt "addressed the symptoms" contradicts the summary
   * whenever the client answered that nothing was tried. Framing the cause
   * as the distance between objective and outcome holds either way.
   */
  const rootCause = gaps.length
    ? `Your objective is defined at a high level, but ${joinList(gaps)} ${
        gaps.length === 1 ? "has" : "have"
      } not been specified yet. Until that's pinned down, this can't be scoped into a plan you can act on.`
    : `Your objective and the outcome you want are both clear, but the distance between them is being held open by how the work is currently set up rather than by a lack of effort. Inside the limits you're operating under (${clause(
        brief.constraints,
      )}), closing it means changing that structure — not pushing harder on the current approach.`;

  return { summary, rootCause };
}

export function generateBrief(conversation: Conversation, projectId: string): GeneratedBrief {
  const userMessages = conversation.messages.filter((m) => m.role === "user").map((m) => m.content);
  const [challenge, situationDetail, existingActions, authority, constraints, desiredOutcome] = userMessages;

  const fields = {
    situation: [challenge, situationDetail].filter(Boolean).join(" "),
    objective: challenge ?? "",
    constraints: constraints || BRIEF_FALLBACKS.constraints,
    authority: authority || BRIEF_FALLBACKS.authority,
    existingActions: existingActions || BRIEF_FALLBACKS.existingActions,
    desiredOutcome: desiredOutcome || BRIEF_FALLBACKS.desiredOutcome,
  };

  return {
    projectId,
    ...fields,
    ...narrateBrief(fields),
    secondaryCategories: [],
    confirmed: false,
  };
}
