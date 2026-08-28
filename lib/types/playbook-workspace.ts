/**
 * The expert-side collaborative playbook.
 *
 * Distinct from `Playbook` in ./playbook.ts, which is the finished artifact a
 * client reads. This is the working document experts curate: a section tree
 * of typed blocks, the people allowed near it, what they've said about it,
 * and what happened to it. The client never sees any of it — only the
 * `Playbook` the Scribe finalises out of it.
 */

/**
 * Content blocks, deliberately few. The sample playbook's structure is
 * insight → evidence → phased steps, plus checklists and matrices — so those
 * are the shapes, rather than arbitrary rich text. Constraining the block
 * types is what keeps this from becoming a word processor.
 */
export type PlaybookBlockBody =
  | { kind: "paragraph"; text: string }
  /** "The Insight" — what the expert should take away before the reasoning. */
  | { kind: "insight"; text: string }
  /** "The Science (The Why)" — the named framework and who established it. */
  | { kind: "science"; framework: string; text: string }
  /** "The Playbook" — numbered steps grouped under a phase. */
  | { kind: "phase"; label: string; steps: string[] }
  | { kind: "checklist"; items: string[] }
  | { kind: "table"; columns: string[]; rows: string[][] }
  | { kind: "list"; items: string[] };

/**
 * A block, with identity. The body carries the content; the id is what makes
 * a block addressable — an edit names one, a comment anchors to one, and the
 * rendered element carries it as `data-block-id` so a text selection can be
 * traced back to the block it came from. Array position can't do any of that,
 * because editing reorders it.
 */
export type PlaybookBlock = { id: string } & PlaybookBlockBody;

export interface PlaybookDocumentSection {
  id: string;
  documentId: string;
  /** Set for a sub-section (the sample's H3 pillars under "Solution"). */
  parentId?: string;
  title: string;
  blocks: PlaybookBlock[];
  order: number;
  /** Bumped on every accepted edit; callers pass it back to detect a stale write. */
  version: number;
}

/**
 * Where the document is in its life. `generating` exists because the baseline
 * is produced from the brief and report — experts should never walk into an
 * empty workspace.
 */
export type PlaybookDocumentStatus =
  | "generating"
  | "ready_for_review"
  | "in_collaboration"
  | "under_curation"
  | "finalized";

export interface PlaybookDocument {
  id: string;
  projectId: string;
  clientId: string;
  title: string;
  /** One line of context so an expert knows what they're curating before reading. */
  challenge: string;
  status: PlaybookDocumentStatus;
  version: number;
  /** The client-facing Playbook this produced, once the Scribe finalised it. */
  publishedPlaybookId?: string;
  createdAt: string;
  /**
   * When the client's playbook is due. Past this the workspace stops waiting
   * for a Scribe and sends whatever it holds — so this, not the per-scribe
   * crown window, is what bounds how long a client waits.
   */
  dueAt: string;
  updatedAt: string;
  finalizedAt?: string;
}

/** Only one collaborator holds `scribe` at a time; the rest contribute. */
export type CollaboratorRole = "scribe" | "contributor";
/** Fallback order. Level 1 holds the crown; 2 and 3 take it if the window lapses. */
export type ScribeLevel = 1 | 2 | 3;

export interface PlaybookCollaborator {
  id: string;
  documentId: string;
  expertId: string;
  role: CollaboratorRole;
  /** Set for the three nominated scribes; absent for ordinary contributors. */
  level?: ScribeLevel;
  status: "active" | "removed";
  joinedAt: string;
  lastActiveAt: string;
  /** When this scribe's curation window lapses and the crown moves down a level. */
  crownExpiresAt?: string;
  /**
   * The block this person has focused right now, so everyone else's tab can
   * show where they're working. Cleared on blur — a stale value is only ever
   * as old as `lastActiveAt`, which is what readers judge it by.
   */
  editingBlockId?: string;
}

/**
 * The prompts contributors are offered instead of a blank box. Experts write
 * better when asked for something specific than when asked for "comments".
 */
export type ContributionKind =
  | "experience"
  | "example"
  | "challenge"
  | "alternative"
  | "risk"
  | "strengthen";

export type CommentStatus = "open" | "accepted" | "rejected" | "resolved";

export interface PlaybookComment {
  id: string;
  documentId: string;
  /** Comments hang off a section, never the document as a whole. */
  sectionId: string;
  expertId: string;
  kind: ContributionKind;
  content: string;
  status: CommentStatus;
  /** Who accepted, rejected or resolved it, and when. */
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;

  /*
    Where in the section this is about. All optional: a comment made against a
    whole section — every one that existed before passages could be selected —
    simply has none of them, and renders without a highlight.
  */
  blockId?: string;
  startOffset?: number;
  endOffset?: number;
  /**
   * The selected passage itself. The offsets go stale the moment the Scribe
   * edits around a comment, so the quote is what actually re-locates it —
   * see resolveAnchor in lib/utils/anchor.ts.
   */
  quote?: string;
  /** Set on a reply. Top-level comments have none. */
  parentCommentId?: string;
}

export type PlaybookActivityAction =
  | "generated"
  | "joined"
  | "commented"
  | "accepted"
  | "rejected"
  | "resolved"
  | "edited"
  | "crown_assigned"
  | "crown_expired"
  | "finalized";

export interface PlaybookActivity {
  id: string;
  documentId: string;
  /** Absent when TailoredIQ itself acted — generating the baseline. */
  actorId?: string;
  action: PlaybookActivityAction;
  detail: string;
  createdAt: string;
}
