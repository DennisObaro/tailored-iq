import type { ContributionKind } from "@/lib/types";

/**
 * Platform configuration for the collaborative workspace. Kept here so the
 * rules can be re-tuned in one place rather than being scattered through the
 * UI as magic numbers.
 */

/** How many experts may hold an active seat on one playbook. */
export const MAX_COLLABORATORS = 15;

/**
 * The hard deadline on a playbook, from the moment the client requests one.
 * This is the promise made on the client side (PLAYBOOK_TURNAROUND, "24-48
 * hours"), so it's the number that actually governs: when it passes, whatever
 * the workspace holds is sent as it stands.
 */
export const PLAYBOOK_DEADLINE_HOURS = 48;

/**
 * How long a Scribe has to curate before the crown falls to the next level.
 *
 * Derived rather than chosen: there are three scribe levels, so a window of a
 * third of the deadline means the full cascade exhausts exactly as the
 * deadline arrives. Setting it independently is what would let the handoff
 * chain outlive the promise made to the client — three 48-hour windows is 144
 * hours, and the client was told 48.
 */
export const SCRIBE_WINDOW_HOURS = PLAYBOOK_DEADLINE_HOURS / 3;

/** The prompts a contributor picks from, instead of an empty box. */
export const CONTRIBUTION_KINDS: { kind: ContributionKind; label: string; placeholder: string }[] = [
  {
    kind: "experience",
    label: "Share relevant experience",
    placeholder: "What happened when you did this, and what did it cost you to learn?",
  },
  {
    kind: "example",
    label: "Add a real-world example",
    placeholder: "A specific case — the situation, what was done, and the result.",
  },
  {
    kind: "challenge",
    label: "Challenge an assumption",
    placeholder: "Which assumption here doesn't hold, and what have you seen instead?",
  },
  {
    kind: "alternative",
    label: "Suggest an alternative",
    placeholder: "What would you do instead, and under what conditions?",
  },
  { kind: "risk", label: "Add a risk", placeholder: "What tends to go wrong here, and what's the early signal?" },
  {
    kind: "strengthen",
    label: "Strengthen this recommendation",
    placeholder: "What would make this more specific, more usable, or harder to misread?",
  },
];

export const CONTRIBUTION_LABELS: Record<ContributionKind, string> = Object.fromEntries(
  CONTRIBUTION_KINDS.map((c) => [c.kind, c.label]),
) as Record<ContributionKind, string>;
