import type {
  Brief,
  CollaboratorRole,
  CommentStatus,
  ContributionKind,
  PlaybookActivity,
  PlaybookActivityAction,
  PlaybookBlockBody,
  PlaybookCollaborator,
  PlaybookComment,
  PlaybookDocument,
  PlaybookDocumentSection,
  Report,
  User,
} from "@/lib/types";
import { simulateNetwork, simulateGeneration, ApiError } from "./client";
import { db, type Database } from "./_db";
import { id } from "@/lib/utils/id";
import { generatePlaybookDocument, type GeneratedSection } from "@/lib/ai-sim/playbook-document-generator";
import {
  MAX_COLLABORATORS,
  PLAYBOOK_DEADLINE_HOURS,
  SCRIBE_WINDOW_HOURS,
} from "@/lib/constants/playbook-workspace";

import { generatePlaybook } from "@/lib/ai-sim/playbook-generator";

/**
 * When a newly crowned Scribe's window should close.
 *
 * Never past the client's deadline: once that passes the document is sent, so
 * a crown window reaching beyond it would promise editing time that doesn't
 * exist. The constants are chosen so three levels land exactly on the
 * deadline, but clamping here is what keeps that true if they're re-tuned.
 */
function crownExpiryFor(d: Database, documentId: string): string {
  const window = Date.now() + SCRIBE_WINDOW_HOURS * 3_600_000;
  const document = d.playbookDocuments.find((doc) => doc.id === documentId);
  const due = document ? new Date(document.dueAt).getTime() : window;
  return new Date(Math.min(window, due)).toISOString();
}

/* ------------------------------------------------------------ permissions */

/**
 * What this viewer may do. Derived from the collaborator row every time,
 * never passed in — the UI reads the same answer the mutations enforce, so a
 * hidden button and a rejected write can't disagree.
 */
export interface WorkspacePermissions {
  canRead: boolean;
  canComment: boolean;
  /** Scribe only: editing official content, and deciding what becomes official. */
  canEdit: boolean;
  canCurate: boolean;
  canFinalize: boolean;
}

const NO_ACCESS: WorkspacePermissions = {
  canRead: false,
  canComment: false,
  canEdit: false,
  canCurate: false,
  canFinalize: false,
};

function permissionsFor(d: Database, documentId: string, viewerId: string): WorkspacePermissions {
  const seat = d.playbookCollaborators.find(
    (c) => c.documentId === documentId && c.expertId === viewerId && c.status === "active",
  );
  if (!seat) return NO_ACCESS;

  const document = d.playbookDocuments.find((doc) => doc.id === documentId);
  const finalized = document?.status === "finalized";
  const isScribe = seat.role === "scribe";

  return {
    canRead: true,
    // A finalised document is history; nothing more gets added to it.
    canComment: !finalized,
    canEdit: isScribe && !finalized,
    canCurate: isScribe && !finalized,
    canFinalize: isScribe && !finalized,
  };
}

export async function getPermissions(documentId: string, viewerId: string): Promise<WorkspacePermissions> {
  return simulateNetwork(() => permissionsFor(db.get(), documentId, viewerId), { latency: [40, 100] });
}

/** Uses the existing notification table — no second inbox for experts to watch. */
function notifyWithin(d: Database, userId: string, title: string, body: string, documentId: string) {
  d.notifications.unshift({
    id: id("notif"),
    userId,
    type: "playbook_collaboration",
    title,
    body,
    linkHref: `/expert/playbooks/${documentId}`,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

/** How long consecutive edits by one person fold into a single log entry. */
const EDIT_COALESCE_MS = 2 * 60_000;

function logWithin(
  d: Database,
  documentId: string,
  action: PlaybookActivityAction,
  detail: string,
  actorId?: string,
) {
  const now = new Date().toISOString();

  /**
   * Editing is continuous in a way commenting isn't — typing through a
   * paragraph would otherwise bury the day's real decisions under fifty
   * "edited a section" lines. Consecutive edits by the same person on the
   * same document rewrite the newest entry instead of adding to it, so the
   * activity feed keeps reading as a history rather than a keystroke log.
   */
  if (action === "edited" && actorId) {
    const newest = d.playbookActivity.find((a) => a.documentId === documentId);
    if (
      newest?.action === "edited" &&
      newest.actorId === actorId &&
      Date.now() - new Date(newest.createdAt).getTime() < EDIT_COALESCE_MS
    ) {
      newest.detail = detail;
      newest.createdAt = now;
      return;
    }
  }

  d.playbookActivity.unshift({
    id: id("activity"),
    documentId,
    actorId,
    action,
    detail,
    createdAt: now,
  });
}

/* -------------------------------------------------------------- generation */

function flattenSections(
  documentId: string,
  generated: GeneratedSection[],
  parentId?: string,
  startOrder = 0,
): PlaybookDocumentSection[] {
  const out: PlaybookDocumentSection[] = [];
  generated.forEach((section, i) => {
    const sectionId = id("section");
    out.push({
      id: sectionId,
      documentId,
      parentId,
      title: section.title,
      /* Identity is minted here, where the block starts existing. */
      blocks: section.blocks.map((body) => ({ id: id("blk"), ...body })),
      order: startOrder + i,
      version: 1,
    });
    if (section.children?.length) out.push(...flattenSections(documentId, section.children, sectionId));
  });
  return out;
}

/**
 * Creates the baseline document the moment the client's material is ready.
 *
 * Internal: called from the report pipeline inside its existing db.update, so
 * a baseline exists for every confirmed brief whether or not the client ever
 * asks for a playbook. Nothing here is visible to the client — this is the
 * expert workspace, and only the Scribe's finalised output crosses over.
 */
export function createBaselineDocumentWithin(
  d: Database,
  input: { projectId: string; brief: Brief; report: Report },
): PlaybookDocument | null {
  const project = d.projects.find((p) => p.id === input.projectId);
  if (!project) return null;
  if (d.playbookDocuments.some((doc) => doc.projectId === input.projectId)) return null;

  const now = new Date().toISOString();
  const document: PlaybookDocument = {
    id: id("playbook_doc"),
    projectId: project.id,
    clientId: project.clientId,
    title: project.title,
    challenge: project.challenge,
    status: "ready_for_review",
    version: 1,
    createdAt: now,
    // The clock the client is actually waiting on starts when the baseline
    // exists, which is the first moment an expert has something to curate.
    dueAt: new Date(Date.now() + PLAYBOOK_DEADLINE_HOURS * 3_600_000).toISOString(),
    updatedAt: now,
  };
  d.playbookDocuments.push(document);
  d.playbookSections.push(...flattenSections(document.id, generatePlaybookDocument(input.brief, input.report)));
  logWithin(d, document.id, "generated", "TailoredIQ generated the initial playbook.");

  return document;
}

/* ----------------------------------------------------------------- reading */

export interface WorkspaceCollaborator {
  collaborator: PlaybookCollaborator;
  user: User;
  role: string;
  /** Heartbeat inside the presence window — this person has the doc open now. */
  present: boolean;
}

/**
 * How stale a heartbeat may be and still count as "here". Comfortably more
 * than the workspace's 30s heartbeat, so a slow tab doesn't flicker out.
 */
const PRESENCE_WINDOW_MS = 2 * 60_000;

export interface WorkspaceView {
  document: PlaybookDocument;
  sections: PlaybookDocumentSection[];
  collaborators: WorkspaceCollaborator[];
  comments: PlaybookComment[];
  activity: PlaybookActivity[];
  permissions: WorkspacePermissions;
  /** The crown holder, so the top bar can name them without a second lookup. */
  scribe?: WorkspaceCollaborator;
  /** Open comments the Scribe still has to rule on. */
  awaitingReview: number;
  viewerId: string;
}

/**
 * Moves the crown down a level when a Scribe's window lapses.
 *
 * Runs inside the same read that renders the workspace, so the transfer
 * happens the moment anyone looks — there is no scheduler here, and a rule
 * that only fires when someone is watching is still a rule that fires. The
 * write is the single source of truth: two tabs racing both land in the same
 * db.update, and the second finds the crown already moved and does nothing.
 */
function crownHasLapsed(d: Database, documentId: string): boolean {
  const current = d.playbookCollaborators.find(
    (c) => c.documentId === documentId && c.status === "active" && c.role === "scribe",
  );
  return !!current?.crownExpiresAt && new Date(current.crownExpiresAt).getTime() <= Date.now();
}

/**
 * Whether the client's deadline has passed on a document that can actually be
 * sent. Read-only, and deliberately checks the brief and report too: the
 * caller uses this to decide whether to open a write at all, and a predicate
 * that said "overdue" for a document finalizeWithin would reject would make
 * every read persist — which, per getWorkspace's note below, wakes every
 * listener and turns reads into a self-feeding loop.
 */
function documentIsOverdue(d: Database, documentId: string): boolean {
  const document = d.playbookDocuments.find((doc) => doc.id === documentId);
  if (!document || document.status === "finalized") return false;
  if (new Date(document.dueAt).getTime() > Date.now()) return false;

  const project = d.projects.find((p) => p.id === document.projectId);
  if (!project) return false;
  return (
    !!d.briefs.find((b) => b.id === project.briefId) && !!d.reports.find((r) => r.id === project.reportId)
  );
}

/**
 * The client's deadline, enforced the same way the crown window is: lazily,
 * the moment anyone looks. Checked *before* any crown transfer — handing the
 * crown to a Level 2 Scribe with no time left is a handoff to nobody, and the
 * client is owed the document either way.
 */
function autoFinalizeIfOverdueWithin(d: Database, documentId: string): boolean {
  if (!documentIsOverdue(d, documentId)) return false;
  finalizeWithin(d, documentId);
  return true;
}

function transferLapsedCrownWithin(d: Database, documentId: string): boolean {
  const seats = d.playbookCollaborators.filter((c) => c.documentId === documentId && c.status === "active");
  const current = seats.find((c) => c.role === "scribe");
  if (!current?.crownExpiresAt) return false;
  if (new Date(current.crownExpiresAt).getTime() > Date.now()) return false;

  const nextLevel = ((current.level ?? 1) + 1) as 2 | 3;
  const successor = seats.find((c) => c.level === nextLevel);

  const outgoing = d.users.find((u) => u.id === current.expertId);
  current.role = "contributor";
  current.crownExpiresAt = undefined;
  logWithin(
    d,
    documentId,
    "crown_expired",
    `${outgoing?.firstName ?? "The Scribe"}'s editing window expired.`,
    current.expertId,
  );

  // Nobody left to take it: the document stays readable and nothing is edited
  // until the platform assigns someone, which is safer than crowning at random.
  if (!successor) return true;

  successor.role = "scribe";
  successor.crownExpiresAt = crownExpiryFor(d, documentId);
  const incoming = d.users.find((u) => u.id === successor.expertId);
  logWithin(
    d,
    documentId,
    "crown_assigned",
    `${incoming?.firstName ?? "An expert"} became Level ${nextLevel} Scribe.`,
    successor.expertId,
  );
  notifyWithin(
    d,
    successor.expertId,
    "You hold the crown",
    `You're now the Scribe on "${d.playbookDocuments.find((doc) => doc.id === documentId)?.title ?? "a playbook"}".`,
    documentId,
  );
  return true;
}

/**
 * The whole workspace in one authorised read. Returns null for anyone who
 * isn't an active collaborator — an expert who saw the brief broadcast but
 * was never seated here gets the ordinary not-found state, not a locked door
 * that confirms the document exists.
 */
export async function getWorkspace(documentId: string, viewerId: string): Promise<WorkspaceView | null> {
  return simulateNetwork(
    () => {
      /**
       * Settle any lapsed crown first — but only write when one has actually
       * lapsed. db.update persists unconditionally, and a persist wakes every
       * listener, which would turn this read into a loop that feeds itself.
       */
      const snapshot = db.get();
      if (documentIsOverdue(snapshot, documentId)) {
        // The deadline outranks the crown: once it passes there is nothing
        // left to hand over, only something to send.
        db.update((d) => autoFinalizeIfOverdueWithin(d, documentId));
      } else if (crownHasLapsed(snapshot, documentId)) {
        db.update((d) => transferLapsedCrownWithin(d, documentId));
      }

      const database = db.get();
      const permissions = permissionsFor(database, documentId, viewerId);
      if (!permissions.canRead) return null;

      const document = database.playbookDocuments.find((doc) => doc.id === documentId);
      if (!document) return null;

      const join = (collaborator: PlaybookCollaborator): WorkspaceCollaborator | null => {
        const user = database.users.find((u) => u.id === collaborator.expertId);
        if (!user) return null;
        const profile = database.expertProfiles.find((p) => p.userId === collaborator.expertId);
        return {
          collaborator,
          user,
          role: profile?.currentRole ?? "Expert",
          present: Date.now() - new Date(collaborator.lastActiveAt).getTime() < PRESENCE_WINDOW_MS,
        };
      };

      const collaborators = database.playbookCollaborators
        .filter((c) => c.documentId === documentId && c.status === "active")
        .map(join)
        .filter((x): x is WorkspaceCollaborator => x !== null)
        .sort((a, b) => (a.collaborator.level ?? 9) - (b.collaborator.level ?? 9));

      const comments = database.playbookComments
        .filter((c) => c.documentId === documentId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

      return {
        document,
        sections: database.playbookSections
          .filter((s) => s.documentId === documentId)
          .sort((a, b) => a.order - b.order),
        collaborators,
        comments,
        activity: database.playbookActivity.filter((a) => a.documentId === documentId).slice(0, 40),
        permissions,
        scribe: collaborators.find((c) => c.collaborator.role === "scribe"),
        awaitingReview: comments.filter((c) => c.status === "open").length,
        viewerId,
      };
    },
    { latency: [140, 300] },
  );
}

export interface WorkspaceSummary {
  document: PlaybookDocument;
  role: CollaboratorRole;
  awaitingReview: number;
}

/** Every workspace this expert has a seat in. */
export async function listWorkspacesForExpert(expertId: string): Promise<WorkspaceSummary[]> {
  return simulateNetwork(
    () => {
      const database = db.get();
      return database.playbookCollaborators
        .filter((c) => c.expertId === expertId && c.status === "active")
        .map((seat) => {
          const document = database.playbookDocuments.find((doc) => doc.id === seat.documentId);
          if (!document) return null;
          return {
            document,
            role: seat.role,
            awaitingReview: database.playbookComments.filter(
              (c) => c.documentId === document.id && c.status === "open",
            ).length,
          };
        })
        .filter((x): x is WorkspaceSummary => x !== null)
        .sort((a, b) => (a.document.updatedAt < b.document.updatedAt ? 1 : -1));
    },
    { latency: [120, 250] },
  );
}

/* --------------------------------------------------------------- mutations */

/**
 * A contributor adding experience to one section.
 *
 * Authorisation is checked here rather than trusted from the caller — a
 * contributor who bypasses the UI entirely still cannot reach official
 * content through this function, because this function only writes comments.
 */
export async function addComment(input: {
  documentId: string;
  sectionId: string;
  expertId: string;
  kind: ContributionKind;
  content: string;
  /* The passage this is about, when it was made against a selection. */
  blockId?: string;
  startOffset?: number;
  endOffset?: number;
  quote?: string;
  /** Set to reply to an existing comment rather than start a thread. */
  parentCommentId?: string;
}): Promise<PlaybookComment> {
  return simulateNetwork(() =>
    db.update((d) => {
      const permissions = permissionsFor(d, input.documentId, input.expertId);
      if (!permissions.canComment) {
        throw new ApiError("You can't contribute to this playbook.", "FORBIDDEN");
      }
      if (!input.content.trim()) throw new ApiError("Write your contribution first.", "VALIDATION");
      const section = d.playbookSections.find(
        (s) => s.id === input.sectionId && s.documentId === input.documentId,
      );
      if (!section) throw new ApiError("That section no longer exists.", "NOT_FOUND");

      const now = new Date().toISOString();
      const comment: PlaybookComment = {
        id: id("comment"),
        documentId: input.documentId,
        sectionId: input.sectionId,
        expertId: input.expertId,
        kind: input.kind,
        content: input.content.trim(),
        /**
         * A reply carries no verdict of its own — the Scribe rules on the
         * thread, not on each message in it, so replies are born resolved and
         * never appear in the "awaiting your review" count.
         */
        status: input.parentCommentId ? "resolved" : "open",
        createdAt: now,
        blockId: input.blockId,
        startOffset: input.startOffset,
        endOffset: input.endOffset,
        quote: input.quote,
        parentCommentId: input.parentCommentId,
      };
      d.playbookComments.push(comment);

      const author = d.users.find((u) => u.id === input.expertId);
      logWithin(
        d,
        input.documentId,
        "commented",
        input.parentCommentId
          ? `${author?.firstName ?? "An expert"} replied in "${section.title}".`
          : `${author?.firstName ?? "An expert"} added an insight to "${section.title}".`,
        input.expertId,
      );

      const document = d.playbookDocuments.find((doc) => doc.id === input.documentId);
      if (document) {
        if (document.status === "ready_for_review") document.status = "in_collaboration";
        document.updatedAt = now;
      }
      return comment;
    }),
  );
}

/**
 * The Scribe ruling on a contribution. Accepting folds the expert's words
 * into the section as an attributed block — the contribution becomes official
 * content while the attribution survives, which is what keeps the final
 * document one coherent piece rather than five essays.
 */
export async function curateComment(input: {
  commentId: string;
  scribeId: string;
  status: Extract<CommentStatus, "accepted" | "rejected" | "resolved">;
  /** The section version the Scribe was looking at, to catch a stale write. */
  expectedSectionVersion?: number;
}): Promise<PlaybookComment> {
  return simulateNetwork(() =>
    db.update((d) => {
      const comment = d.playbookComments.find((c) => c.id === input.commentId);
      if (!comment) throw new ApiError("That contribution no longer exists.", "NOT_FOUND");

      const permissions = permissionsFor(d, comment.documentId, input.scribeId);
      if (!permissions.canCurate) {
        throw new ApiError("Only the current Scribe can decide what becomes official content.", "FORBIDDEN");
      }
      if (comment.status !== "open") {
        throw new ApiError("This contribution has already been reviewed.", "INVALID_STATE");
      }

      const section = d.playbookSections.find((s) => s.id === comment.sectionId);
      if (!section) throw new ApiError("That section no longer exists.", "NOT_FOUND");
      if (input.expectedSectionVersion !== undefined && section.version !== input.expectedSectionVersion) {
        throw new ApiError(
          "This section changed while you were reviewing. Reload to see the current version.",
          "VERSION_CONFLICT",
        );
      }

      const now = new Date().toISOString();
      comment.status = input.status;
      comment.resolvedBy = input.scribeId;
      comment.resolvedAt = now;

      const author = d.users.find((u) => u.id === comment.expertId);
      const authorName = author ? `${author.firstName} ${author.lastName}` : "an expert";

      if (input.status === "accepted") {
        const block = {
          id: id("blk"),
          kind: "paragraph" as const,
          text: `${comment.content} — contributed by ${authorName}`,
        };
        /**
         * Lands next to the passage it answers rather than at the foot of the
         * section. A comment on the opening paragraph is a remark about that
         * paragraph, and appending it four blocks later loses the thread of
         * the argument the Scribe is trying to keep coherent.
         */
        const anchor = comment.blockId
          ? section.blocks.findIndex((b) => b.id === comment.blockId)
          : -1;
        if (anchor === -1) section.blocks.push(block);
        else section.blocks.splice(anchor + 1, 0, block);
        section.version += 1;
      }

      const scribe = d.users.find((u) => u.id === input.scribeId);
      logWithin(
        d,
        comment.documentId,
        input.status === "accepted" ? "accepted" : input.status === "rejected" ? "rejected" : "resolved",
        `${scribe?.firstName ?? "The Scribe"} ${input.status} ${authorName}'s contribution to "${section.title}".`,
        input.scribeId,
      );

      notifyWithin(
        d,
        comment.expertId,
        input.status === "accepted" ? "Your contribution was accepted" : `Your contribution was ${input.status}`,
        input.status === "accepted"
          ? `${scribe?.firstName ?? "The Scribe"} folded your input into "${section.title}".`
          : `${scribe?.firstName ?? "The Scribe"} reviewed your input on "${section.title}".`,
        comment.documentId,
      );

      const document = d.playbookDocuments.find((doc) => doc.id === comment.documentId);
      if (document) {
        document.status = "under_curation";
        document.updatedAt = now;
        document.version += 1;
      }
      return comment;
    }),
  );
}

/* ----------------------------------------------------------------- editing */

/**
 * Every edit resolves the same three things and enforces the same rule, so
 * they resolve them once: the Scribe's permission, the section, and the
 * version the caller was looking at.
 *
 * Only `canEdit` gets past here — which is what makes the document read-only
 * for contributors in fact and not merely in appearance. A contributor who
 * called this directly would be refused exactly as the UI implies.
 */
function editSectionWithin<T>(
  d: Database,
  input: { documentId: string; sectionId: string; editorId: string; expectedSectionVersion?: number },
  mutate: (section: PlaybookDocumentSection) => T,
): T {
  const permissions = permissionsFor(d, input.documentId, input.editorId);
  if (!permissions.canEdit) {
    throw new ApiError("Only the current Scribe can edit this playbook.", "FORBIDDEN");
  }

  const section = d.playbookSections.find(
    (s) => s.id === input.sectionId && s.documentId === input.documentId,
  );
  if (!section) throw new ApiError("That section no longer exists.", "NOT_FOUND");
  if (input.expectedSectionVersion !== undefined && section.version !== input.expectedSectionVersion) {
    throw new ApiError(
      "This section changed while you were editing. Reload to see the current version.",
      "VERSION_CONFLICT",
    );
  }

  const result = mutate(section);
  section.version += 1;

  const editor = d.users.find((u) => u.id === input.editorId);
  logWithin(
    d,
    input.documentId,
    "edited",
    `${editor?.firstName ?? "The Scribe"} edited "${section.title}".`,
    input.editorId,
  );

  const document = d.playbookDocuments.find((doc) => doc.id === input.documentId);
  if (document) document.updatedAt = new Date().toISOString();

  return result;
}

export interface EditBlockInput {
  documentId: string;
  sectionId: string;
  blockId: string;
  editorId: string;
  expectedSectionVersion?: number;
}

/** Replaces one block's content, keeping its identity so comments stay anchored. */
export async function updateBlock(
  input: EditBlockInput & { body: PlaybookBlockBody },
): Promise<PlaybookDocumentSection> {
  return simulateNetwork(
    () =>
      db.update((d) =>
        editSectionWithin(d, input, (section) => {
          const index = section.blocks.findIndex((b) => b.id === input.blockId);
          if (index === -1) throw new ApiError("That block no longer exists.", "NOT_FOUND");
          section.blocks[index] = { id: input.blockId, ...input.body };
          return section;
        }),
      ),
    /* Typing waits on this, so it's the fastest write in the module. */
    { latency: [80, 180] },
  );
}

/** Adds a block below `afterBlockId`, or at the end when that's omitted. */
export async function insertBlock(
  input: Omit<EditBlockInput, "blockId"> & { afterBlockId?: string; body: PlaybookBlockBody },
): Promise<PlaybookDocumentSection> {
  return simulateNetwork(() =>
    db.update((d) =>
      editSectionWithin(d, { ...input, sectionId: input.sectionId }, (section) => {
        const block = { id: id("blk"), ...input.body };
        const after = input.afterBlockId
          ? section.blocks.findIndex((b) => b.id === input.afterBlockId)
          : -1;
        if (after === -1) section.blocks.push(block);
        else section.blocks.splice(after + 1, 0, block);
        return section;
      }),
    ),
  );
}

export async function deleteBlock(input: EditBlockInput): Promise<PlaybookDocumentSection> {
  return simulateNetwork(() =>
    db.update((d) =>
      editSectionWithin(d, input, (section) => {
        section.blocks = section.blocks.filter((b) => b.id !== input.blockId);
        /**
         * Comments anchored to it are orphaned rather than deleted. The
         * argument an expert made outlives the sentence it was about, and
         * silently dropping it would erase history the Scribe may still need.
         */
        return section;
      }),
    ),
  );
}

export async function moveBlock(
  input: EditBlockInput & { direction: "up" | "down" },
): Promise<PlaybookDocumentSection> {
  return simulateNetwork(() =>
    db.update((d) =>
      editSectionWithin(d, input, (section) => {
        const from = section.blocks.findIndex((b) => b.id === input.blockId);
        const to = from + (input.direction === "up" ? -1 : 1);
        if (from === -1 || to < 0 || to >= section.blocks.length) {
          throw new ApiError("That block can't move any further.", "INVALID_STATE");
        }
        const [block] = section.blocks.splice(from, 1);
        section.blocks.splice(to, 0, block);
        return section;
      }),
    ),
  );
}

export async function renameSection(
  input: Omit<EditBlockInput, "blockId"> & { title: string },
): Promise<PlaybookDocumentSection> {
  return simulateNetwork(
    () =>
      db.update((d) =>
        editSectionWithin(d, input, (section) => {
          if (!input.title.trim()) throw new ApiError("A section needs a title.", "VALIDATION");
          section.title = input.title.trim();
          return section;
        }),
      ),
    { latency: [80, 180] },
  );
}

/**
 * Presence: which block this person has focused, so other tabs can show where
 * they're working. Writes nothing else and logs nothing — it fires on every
 * focus change, and an activity entry per click would be noise.
 */
export async function setEditingBlock(
  documentId: string,
  expertId: string,
  blockId: string | undefined,
): Promise<void> {
  return simulateNetwork(
    () => {
      db.update((d) => {
        const seat = d.playbookCollaborators.find(
          (c) => c.documentId === documentId && c.expertId === expertId && c.status === "active",
        );
        if (!seat) return;
        seat.editingBlockId = blockId;
        seat.lastActiveAt = new Date().toISOString();
      });
    },
    { latency: [20, 60] },
  );
}

/**
 * The succession slot a newly seated expert takes.
 *
 * Levels 1-3 are the crown's fallback order. Only the fixture ever assigned
 * them, so on any document created at runtime the crown had nowhere to fall
 * when a window lapsed — the first three people through the door now take
 * those slots, and everyone after them is an ordinary contributor.
 */
function nextScribeLevelWithin(d: Database, documentId: string): 1 | 2 | 3 | undefined {
  const taken = new Set(
    d.playbookCollaborators
      .filter((c) => c.documentId === documentId && c.status === "active")
      .map((c) => c.level),
  );
  return ([1, 2, 3] as const).find((level) => !taken.has(level));
}

/**
 * Seats an expert on a document, and decides what they hold.
 *
 * A document with nobody wearing the crown can't be edited by anyone, which
 * is the state every runtime-generated playbook started in: the baseline is
 * created by the report pipeline with no collaborators, and both ways in
 * seated arrivals as contributors, so the first expert through the door found
 * a draft that no one was allowed to write. The rule is now the obvious one —
 * an unclaimed playbook is claimed by whoever arrives — and it applies to a
 * returning contributor too, so a document that was left Scribe-less doesn't
 * stay that way just because everyone on it has been seated before.
 *
 * Where a Scribe already holds the crown nothing changes: arrivals contribute,
 * and take a fallback level if one is free.
 */
function seatExpertWithin(d: Database, documentId: string, expertId: string): PlaybookCollaborator {
  const document = d.playbookDocuments.find((doc) => doc.id === documentId);
  if (!document) throw new ApiError("Playbook not found.", "NOT_FOUND");

  const now = new Date().toISOString();
  const unclaimed = !d.playbookCollaborators.some(
    (c) => c.documentId === documentId && c.status === "active" && c.role === "scribe",
  );
  const user = d.users.find((u) => u.id === expertId);
  const crown = (seat: PlaybookCollaborator) => {
    seat.role = "scribe";
    seat.level = seat.level ?? nextScribeLevelWithin(d, documentId) ?? 1;
    seat.crownExpiresAt = crownExpiryFor(d, documentId);
    logWithin(
      d,
      documentId,
      "crown_assigned",
      `${user?.firstName ?? "An expert"} took the crown on an unclaimed playbook.`,
      expertId,
    );
  };

  const existing = d.playbookCollaborators.find((c) => c.documentId === documentId && c.expertId === expertId);
  if (existing) {
    existing.status = "active";
    existing.lastActiveAt = now;
    // A finalised document is history; its crown isn't up for grabs.
    if (unclaimed && document.status !== "finalized") crown(existing);
    return existing;
  }

  const seated = d.playbookCollaborators.filter(
    (c) => c.documentId === documentId && c.status === "active",
  ).length;
  if (seated >= MAX_COLLABORATORS) {
    throw new ApiError("This playbook is currently at capacity.", "AT_CAPACITY");
  }

  const profile = d.expertProfiles.find((p) => p.userId === expertId);
  if (!profile || profile.verificationStatus !== "approved") {
    throw new ApiError("Only approved experts can join a playbook.", "NOT_APPROVED");
  }

  const collaborator: PlaybookCollaborator = {
    id: id("collaborator"),
    documentId,
    expertId,
    role: "contributor",
    level: nextScribeLevelWithin(d, documentId),
    status: "active",
    joinedAt: now,
    lastActiveAt: now,
  };
  d.playbookCollaborators.push(collaborator);
  logWithin(d, documentId, "joined", `${user?.firstName ?? "An expert"} joined the collaboration.`, expertId);
  if (unclaimed && document.status !== "finalized") crown(collaborator);

  return collaborator;
}

/**
 * The way in from a project. Finds (or generates) that project's baseline
 * document and seats the expert as a contributor if they aren't already — one
 * call, because "contribute to the playbook" is a single intention, not a
 * lookup followed by a join the caller has to remember to make.
 */
export async function openWorkspaceForProject(
  projectId: string,
  expertId: string,
): Promise<{ documentId: string } | null> {
  return simulateNetwork(() =>
    db.update((d) => {
      const project = d.projects.find((p) => p.id === projectId);
      const brief = project ? d.briefs.find((b) => b.id === project.briefId) : undefined;
      const report = project ? d.reports.find((r) => r.id === project.reportId) : undefined;
      /**
       * A project whose report was generated before this workspace existed has
       * no baseline. Build it here from the same brief and report the report
       * pipeline uses — an expert arriving to contribute should find the draft,
       * not a message explaining why there isn't one.
       */
      const document =
        d.playbookDocuments.find((doc) => doc.projectId === projectId) ??
        (brief && report ? createBaselineDocumentWithin(d, { projectId, brief, report }) : null);
      if (!document) return null;

      seatExpertWithin(d, document.id, expertId);
      return { documentId: document.id };
    }),
  );
}

/**
 * The Scribe closing the document.
 *
 * This is the only crossing point between the expert workspace and the
 * client: everything the experts argued about stays here, and what the client
 * receives is the curated result as an ordinary Playbook, subject to the
 * access rules that already govern one. Nothing is deleted — the comments,
 * the rejections and the attribution all survive as history.
 */
/**
 * Turns the workspace into the client's playbook.
 *
 * Shared by the two ways that happens: a Scribe deciding it's ready, and the
 * deadline deciding for them. Both must produce the same artifact — a client
 * should not be able to tell from the playbook itself whether an expert
 * pressed the button — so the only thing that differs is `actorId`, which is
 * absent when the platform acted (the convention the activity log already
 * uses for `generated`).
 */
function finalizeWithin(d: Database, documentId: string, actorId?: string): PlaybookDocument {
  const document = d.playbookDocuments.find((doc) => doc.id === documentId);
  if (!document) throw new ApiError("Playbook not found.", "NOT_FOUND");

  const project = d.projects.find((p) => p.id === document.projectId);
  const brief = project ? d.briefs.find((b) => b.id === project.briefId) : undefined;
  const report = project ? d.reports.find((r) => r.id === project.reportId) : undefined;
  if (!project || !brief || !report) {
    throw new ApiError("The client's brief and executive summary are needed first.", "NOT_READY");
  }

  const now = new Date().toISOString();
  const contributions = d.contributions.filter((c) => c.projectId === project.id);
  const generated = generatePlaybook(brief, report, null, contributions);

  /**
   * The curated sections become the client's playbook body. Only accepted
   * material is here — rejected and still-open contributions never made it
   * into a section, so they cannot leak across.
   */
  const sections = d.playbookSections
    .filter((s) => s.documentId === documentId)
    .sort((a, b) => a.order - b.order)
    .map((section) => ({
      heading: section.title,
      body: section.blocks
        .map((block) => {
          switch (block.kind) {
            case "paragraph":
            case "insight":
              return block.text;
            case "science":
              return `${block.framework}. ${block.text}`;
            case "phase":
              return `${block.label}\n${block.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
            case "checklist":
            case "list":
              return block.items.map((item) => `• ${item}`).join("\n");
            case "table":
              return block.rows.map((row) => row.join(" — ")).join("\n");
          }
        })
        .join("\n\n"),
    }));

  const playbook = {
    ...generated,
    id: id("playbook"),
    projectId: project.id,
    sections,
    expertContributionIds: contributions.map((c) => c.id),
    status: "ready" as const,
    createdAt: now,
    updatedAt: now,
  };
  d.playbooks.push(playbook);

  project.playbookId = playbook.id;
  project.status = "playbook_ready";
  project.updatedAt = now;
  project.activity.push({ id: id("act"), label: "Playbook finalized", timestamp: now });

  document.status = "finalized";
  document.finalizedAt = now;
  document.publishedPlaybookId = playbook.id;
  document.updatedAt = now;
  document.version += 1;

  const actor = actorId ? d.users.find((u) => u.id === actorId) : undefined;
  logWithin(
    d,
    documentId,
    "finalized",
    actorId
      ? `${actor?.firstName ?? "The Scribe"} finalized the playbook.`
      : "The 48-hour window closed — the playbook was sent to the client as it stood.",
    actorId,
  );

  // Everyone who contributed hears that it shipped — and if the deadline
  // sent it rather than a person, they're told that, since an expert who
  // was mid-edit needs to know why it left without them.
  for (const seat of d.playbookCollaborators.filter((c) => c.documentId === documentId)) {
    notifyWithin(
      d,
      seat.expertId,
      actorId ? "Playbook finalized" : "Playbook sent — deadline reached",
      actorId
        ? `"${document.title}" is now the official TailoredIQ playbook.`
        : `The 48-hour window on "${document.title}" closed, so it went to the client as it stood.`,
      documentId,
    );
  }
  d.notifications.unshift({
    id: id("notif"),
    userId: project.clientId,
    type: "playbook_ready",
    title: "Your playbook is ready",
    body: `The playbook for "${project.title}" is ready to view.`,
    linkHref: `/playbooks/${playbook.id}`,
    read: false,
    createdAt: now,
  });

  return document;
}

export async function finalizePlaybook(documentId: string, scribeId: string): Promise<PlaybookDocument> {
  return simulateGeneration(() =>
    db.update((d) => {
      const permissions = permissionsFor(d, documentId, scribeId);
      if (!permissions.canFinalize) {
        throw new ApiError("Only the current Scribe can finalize this playbook.", "FORBIDDEN");
      }
      return finalizeWithin(d, documentId, scribeId);
    }),
  );
}

/** Keeps presence honest: a heartbeat while the workspace is open. */
export async function touchPresence(documentId: string, expertId: string): Promise<void> {
  return simulateNetwork(
    () => {
      db.update((d) => {
        const seat = d.playbookCollaborators.find(
          (c) => c.documentId === documentId && c.expertId === expertId && c.status === "active",
        );
        if (seat) seat.lastActiveAt = new Date().toISOString();
      });
    },
    { latency: [20, 60] },
  );
}

/** Seats an expert. Refuses past the configured cap rather than silently overfilling. */
export async function joinWorkspace(documentId: string, expertId: string): Promise<PlaybookCollaborator> {
  return simulateGeneration(() => db.update((d) => seatExpertWithin(d, documentId, expertId)));
}

export { MAX_COLLABORATORS, SCRIBE_WINDOW_HOURS };
