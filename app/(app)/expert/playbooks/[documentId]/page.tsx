"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Award, ChevronRight } from "@/components/icons";
import type { PlaybookBlockBody, PlaybookComment, PlaybookDocumentSection } from "@/lib/types";
import type { WorkspaceView } from "@/lib/api/playbook-workspace";
import * as workspaceApi from "@/lib/api/playbook-workspace";
import { subscribeToDataChanges } from "@/lib/api/realtime";
import { CONTRIBUTION_KINDS } from "@/lib/constants/playbook-workspace";
import { EditableBlock } from "@/components/playbook/editable-block";
import { CommentThreadCard, type CommentThread } from "@/components/playbook/comment-thread-card";
import { SelectionCommentBubble } from "@/components/playbook/selection-comment-bubble";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useSessionStore } from "@/lib/store/use-session-store";
import { useAutosave } from "@/hooks/use-autosave";
import { useCountdown } from "@/hooks/use-countdown";
import { useTextSelection, type BlockSelection } from "@/hooks/use-text-selection";
import { anchorableText, anchorsForBlock, resolveAnchor } from "@/lib/utils/anchor";
import { formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/**
 * The deadline gets louder as it approaches. It sits in a row of ordinary
 * grey copy, so at six hours it takes the gold the workspace already uses for
 * "needs you", and in the last hour the danger tone — reserved for the point
 * where not acting has a consequence the expert can no longer undo.
 */
const DEADLINE_TONE = {
  calm: "text-gray-300",
  soon: "text-gold",
  critical: "text-danger-400",
} as const;

const STATUS_COPY: Record<string, string> = {
  generating: "Preparing the playbook",
  ready_for_review: "Ready for expert review",
  in_collaboration: "Expert collaboration",
  under_curation: "Under curation",
  finalized: "Finalized",
};

/**
 * Comments grouped into threads, each told whether its passage still exists.
 *
 * `anchored: false` is the case worth naming: the comment quoted something
 * the Scribe has since edited away. The thread survives — an expert's
 * argument outlives the sentence that prompted it — but it renders without a
 * highlight and says so, rather than pointing at whatever now sits at those
 * character positions.
 */
function buildThreads(
  comments: PlaybookComment[],
  sections: PlaybookDocumentSection[],
): CommentThread[] {
  const byParent = new Map<string, PlaybookComment[]>();
  for (const c of comments) {
    if (!c.parentCommentId) continue;
    byParent.set(c.parentCommentId, [...(byParent.get(c.parentCommentId) ?? []), c]);
  }

  const blockText = new Map<string, string>();
  for (const section of sections) {
    for (const block of section.blocks) {
      const text = anchorableText(block);
      if (text !== null) blockText.set(block.id, text);
    }
  }

  return comments
    .filter((c) => !c.parentCommentId)
    .map((comment) => {
      const text = comment.blockId ? blockText.get(comment.blockId) : undefined;
      return {
        comment,
        replies: (byParent.get(comment.id) ?? []).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
        anchored: text !== undefined && resolveAnchor(text, comment).state !== "orphaned",
        sectionTitle: sections.find((s) => s.id === comment.sectionId)?.title,
      };
    });
}

/**
 * An editable section heading. A textarea rather than an input because the
 * generated pillar titles run to a full sentence, and an input hides the
 * overflow rather than wrapping it.
 */
function TitleField({
  value,
  nested,
  onChange,
  onBlur,
}: {
  value: string;
  nested?: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      className={cn(
        "-mx-2 w-full resize-none overflow-hidden rounded-md border border-transparent bg-transparent px-2 font-medium text-gray-50",
        "focus:border-gray-800 focus:bg-gray-900 focus-visible:outline-none",
        nested ? "text-base" : "text-lg",
      )}
    />
  );
}

/** What the Scribe's last write is doing, shown next to the document title. */
function SaveStatus({ state, savedAt }: { state: string; savedAt: string | null }) {
  if (state === "saving") return <span className="text-xs text-gray-500">Saving…</span>;
  if (state === "error") return <span className="text-xs text-danger-400">Couldn&apos;t save</span>;
  if (state === "saved" && savedAt) {
    return <span className="text-xs text-gray-500">Saved {formatRelative(savedAt)}</span>;
  }
  return null;
}

export default function PlaybookWorkspacePage() {
  const { documentId } = useParams<{ documentId: string }>();
  const user = useSessionStore((s) => s.user);
  const [view, setView] = useState<WorkspaceView | null | undefined>(undefined);
  const [panel, setPanel] = useState<"comments" | "activity">("comments");
  const [focusedCommentId, setFocusedCommentId] = useState<string | null>(null);
  const [composer, setComposer] = useState<
    { sectionId: string; anchor?: BlockSelection } | null
  >(null);
  const [draft, setDraft] = useState("");
  const [kind, setKind] = useState(CONTRIBUTION_KINDS[0].kind);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmFinalize, setConfirmFinalize] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  /**
   * A refresh is in flight, or a block is focused. Both are reasons not to
   * stamp server state over what's on screen — see `load` below.
   */
  const pendingRef = useRef(false);

  const load = useCallback(async () => {
    if (!user || pendingRef.current) return;
    pendingRef.current = true;
    try {
      setView(await workspaceApi.getWorkspace(documentId, user.id));
    } finally {
      pendingRef.current = false;
    }
  }, [documentId, user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const sync = () => {
      if (!cancelled) load();
    };
    sync();

    // Someone else's edit or comment should appear without a reload — the same
    // change feed the rest of the app uses, no new infrastructure.
    const unsubscribe = subscribeToDataChanges(sync);
    /** Keeps this expert's presence fresh while the workspace stays open. */
    const heartbeat = setInterval(() => {
      if (!cancelled) workspaceApi.touchPresence(documentId, user.id);
    }, 30_000);

    return () => {
      cancelled = true;
      unsubscribe();
      clearInterval(heartbeat);
      /* Leaving the page is leaving the block. */
      workspaceApi.setEditingBlock(documentId, user.id, undefined);
    };
  }, [documentId, user, load]);

  const isScribe = !!view?.permissions.canCurate;
  const canEdit = !!view?.permissions.canEdit;

  /* Only the Scribe writes, so only the Scribe needs a save lane. */
  const autosave = useAutosave<() => Promise<unknown>>((run) => run());

  const { selection, clear: clearSelection } = useTextSelection(scrollRef, {
    enabled: !!view?.permissions.canComment,
  });

  /* Above the early returns, like every other hook here — it takes an
     optional deadline and returns null for one that isn't loaded yet. */
  const countdown = useCountdown(view?.document.dueAt);

  if (view === undefined) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!view) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <ErrorState
          whatHappened="We couldn't find this playbook workspace."
          dataSafe="Nothing has been lost. You may not be one of its collaborators."
        />
      </div>
    );
  }

  const { document: doc, sections, collaborators, comments, activity, permissions, scribe, awaitingReview } = view;
  const topLevel = sections.filter((s) => !s.parentId);
  const present = collaborators.filter((c) => c.present);

  /** Who else has a block open right now, so their name can sit under it. */
  const editorsByBlock = new Map(
    collaborators
      .filter((c) => c.present && c.collaborator.editingBlockId && c.user.id !== user?.id)
      .map((c) => [c.collaborator.editingBlockId!, c.user.firstName]),
  );

  /* -------------------------------------------------------------- writing */

  function edit(run: () => Promise<unknown>, { immediate = false } = {}) {
    setError(null);
    if (immediate) {
      autosave.schedule(run);
      return autosave.flush();
    }
    autosave.schedule(run);
  }

  function onBlockChange(section: PlaybookDocumentSection, blockId: string, body: PlaybookBlockBody) {
    if (!user) return;
    edit(() =>
      workspaceApi.updateBlock({
        documentId,
        sectionId: section.id,
        blockId,
        body,
        editorId: user.id,
      }),
    );
  }

  async function runNow(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  /* ------------------------------------------------------------ comments */

  /* Plain computation, not a memo: hooks can't run below the early returns
     above, and a handful of comments is nothing to recompute. */
  const threads: CommentThread[] = buildThreads(comments, sections);

  async function submitComment() {
    if (!user || !composer || !draft.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await workspaceApi.addComment({
        documentId,
        sectionId: composer.sectionId,
        expertId: user.id,
        kind,
        content: draft,
        blockId: composer.anchor?.blockId,
        startOffset: composer.anchor?.start,
        endOffset: composer.anchor?.end,
        quote: composer.anchor?.quote,
      });
      setDraft("");
      setComposer(null);
      clearSelection();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  /** Which section a selected block belongs to, for the comment's sectionId. */
  function sectionOfBlock(blockId: string) {
    return sections.find((s) => s.blocks.some((b) => b.id === blockId));
  }

  function focusComment(commentId: string) {
    setFocusedCommentId(commentId);
    setPanel("comments");
    const comment = comments.find((c) => c.id === commentId);
    if (!comment?.blockId) return;
    scrollRef.current
      ?.querySelector(`[data-block-id="${comment.blockId}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-gray-800 px-6 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href={`/expert/projects/${doc.projectId}`}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
          >
            Back to project
            <ChevronRight className="size-3" aria-hidden />
          </Link>
          <p className="text-sm font-medium text-gray-50">{doc.title}</p>
          <StatusBadge status={doc.status} variant="bare" />
          {canEdit && <SaveStatus state={autosave.state} savedAt={autosave.savedAt} />}

          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center">
              {collaborators.slice(0, 5).map(({ collaborator, user: expert, present: here }, i) => (
                <Avatar
                  key={collaborator.id}
                  firstName={expert.firstName}
                  lastName={expert.lastName}
                  src={expert.avatarUrl}
                  size="sm"
                  online={here}
                  className={cn("rounded-full ring-[1.5px] ring-gray-975", i > 0 && "-ml-2")}
                />
              ))}
              <span className="ml-2 text-xs text-gray-500">
                {collaborators.length} on this playbook
                {present.length > 0 && <span className="text-gray-400"> · {present.length} here now</span>}
              </span>
            </div>
            {scribe && (
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Award className="size-3.5 text-gold" aria-hidden />
                {scribe.user.firstName} {scribe.user.lastName}
                <span className="text-gray-500">· Level {scribe.collaborator.level ?? 1} Scribe</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* The role a viewer holds decides what the workspace asks of them. */}
      <div className="shrink-0 border-b border-gray-800 bg-gray-950 px-6 py-2.5">
        <p className="mx-auto max-w-6xl text-xs text-gray-400">
          {isScribe ? (
            <>
              <span className="font-medium text-gray-200">You hold the crown. </span>
              Edit the playbook directly, and decide which expert contributions become part of it.
              {awaitingReview > 0 && <span className="text-gold"> {awaitingReview} awaiting your review.</span>}
              {countdown && !doc.finalizedAt && (
                <span className={DEADLINE_TONE[countdown.urgency]}>
                  {countdown.expired
                    ? " Deadline reached — this is going to the client as it stands."
                    : ` ${countdown.label} left — at zero this goes to the client as it stands.`}
                </span>
              )}
              {permissions.canFinalize && (
                <button
                  type="button"
                  onClick={() => setConfirmFinalize(true)}
                  className="ml-2 text-gray-300 underline decoration-gray-700 underline-offset-2 hover:text-gray-50"
                >
                  Finalize playbook
                </button>
              )}
            </>
          ) : (
            <>
              <span className="font-medium text-gray-200">You&apos;ve been invited to contribute. </span>
              Select any passage to comment on it — the Scribe decides what becomes official content.
              {/* Contributors get the same clock but not the warning: what
                  happens at zero is the Scribe's responsibility, and telling
                  someone about a consequence they can't act on is just noise. */}
              {countdown && !doc.finalizedAt && !countdown.expired && (
                <span className={DEADLINE_TONE[countdown.urgency]}>
                  {" "}
                  {countdown.label} left before this goes to the client.
                </span>
              )}
            </>
          )}
        </p>
      </div>

      {confirmFinalize && (
        <div className="shrink-0 border-b border-primary-500/30 bg-primary-500/5 px-6 py-3">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-100">Finalize playbook?</p>
              <p className="mt-0.5 text-xs text-gray-400">
                Once finalized, this version becomes the official TailoredIQ playbook for this challenge and
                goes to the client. Contributions and history are kept.
              </p>
            </div>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmFinalize(false)}>
              Continue reviewing
            </Button>
            <Button
              size="sm"
              loading={busy}
              onClick={() =>
                runNow(async () => {
                  if (!user) return;
                  await workspaceApi.finalizePlaybook(documentId, user.id);
                  setConfirmFinalize(false);
                })
              }
            >
              Finalize playbook
            </Button>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div ref={scrollRef} className="thin-scrollbar min-w-0 flex-1 overflow-y-auto">
          <article className="mx-auto max-w-3xl px-6 py-8 pl-14">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              {STATUS_COPY[doc.status]} · updated {formatRelative(doc.updatedAt)}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-gray-50">{doc.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">{doc.challenge}</p>

            <div className="mt-8 flex flex-col gap-10">
              {topLevel.map((section) => (
                <SectionView
                  key={section.id}
                  section={section}
                  childSections={sections.filter((s) => s.parentId === section.id)}
                  comments={comments}
                  canEdit={canEdit}
                  canComment={permissions.canComment}
                  focusedCommentId={focusedCommentId}
                  editorsByBlock={editorsByBlock}
                  onFocusComment={focusComment}
                  onBlockChange={onBlockChange}
                  onCommit={autosave.flush}
                  onFocusBlock={(blockId) =>
                    user && workspaceApi.setEditingBlock(documentId, user.id, blockId)
                  }
                  onBlockAction={runNow}
                  documentId={documentId}
                  editorId={user?.id}
                  onAddInsight={(sectionId) => {
                    setComposer({ sectionId });
                    setPanel("comments");
                  }}
                />
              ))}
            </div>
          </article>
        </div>

        <aside className="thin-scrollbar hidden w-96 shrink-0 flex-col overflow-y-auto border-l border-gray-800 lg:flex">
          <div className="sticky top-0 flex gap-1 border-b border-gray-800 bg-gray-975 p-3">
            {(["comments", "activity"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPanel(tab)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  panel === tab ? "bg-gray-900 text-gray-50" : "text-gray-400 hover:text-gray-200",
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 p-4">
            {error && <p className="text-xs text-danger-400">{error}</p>}

            {panel === "activity" ? (
              activity.map((entry) => (
                <div key={entry.id} className="border-b border-gray-900 pb-3 last:border-0">
                  <p className="text-xs leading-relaxed text-gray-300">{entry.detail}</p>
                  <p className="mt-1 text-xs text-gray-500">{formatRelative(entry.createdAt)}</p>
                </div>
              ))
            ) : (
              <>
                {composer && permissions.canComment && (
                  <Card className="flex flex-col gap-2 p-3">
                    {composer.anchor ? (
                      <p className="border-l-2 border-gold/40 pl-2 text-xs italic leading-relaxed text-gray-400">
                        {composer.anchor.quote}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        Contributing to{" "}
                        <span className="text-gray-300">
                          {sections.find((s) => s.id === composer.sectionId)?.title}
                        </span>
                      </p>
                    )}
                    <select
                      value={kind}
                      onChange={(e) => setKind(e.target.value as typeof kind)}
                      className="h-8 rounded-md border border-gray-800 bg-gray-950 px-2 text-xs text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      {CONTRIBUTION_KINDS.map((option) => (
                        <option key={option.kind} value={option.kind}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={4}
                      autoFocus
                      placeholder={CONTRIBUTION_KINDS.find((c) => c.kind === kind)?.placeholder}
                      className="resize-none rounded-md border border-gray-800 bg-gray-950 p-2 text-xs leading-relaxed text-gray-100 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    />
                    <div className="flex gap-1.5">
                      <Button size="sm" loading={busy} disabled={!draft.trim()} onClick={submitComment}>
                        Add contribution
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => {
                          setComposer(null);
                          clearSelection();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Card>
                )}

                {threads.length === 0 ? (
                  <p className="px-1 py-6 text-center text-xs text-gray-500">
                    No contributions yet. Select a passage in the document to comment on it.
                  </p>
                ) : (
                  threads.map((thread) => (
                    <CommentThreadCard
                      key={thread.comment.id}
                      thread={thread}
                      collaborators={collaborators}
                      canCurate={isScribe}
                      canReply={permissions.canComment}
                      busy={busy}
                      focused={focusedCommentId === thread.comment.id}
                      onFocus={() => focusComment(thread.comment.id)}
                      onCurate={(status) =>
                        runNow(async () => {
                          if (!user) return;
                          await workspaceApi.curateComment({
                            commentId: thread.comment.id,
                            scribeId: user.id,
                            status,
                          });
                        })
                      }
                      onReply={async (content) => {
                        if (!user) return;
                        await workspaceApi.addComment({
                          documentId,
                          sectionId: thread.comment.sectionId,
                          expertId: user.id,
                          kind: thread.comment.kind,
                          content,
                          parentCommentId: thread.comment.id,
                        });
                        await load();
                      }}
                    />
                  ))
                )}
              </>
            )}
          </div>
        </aside>
      </div>

      <SelectionCommentBubble
        selection={selection}
        onComment={(picked) => {
          const section = sectionOfBlock(picked.blockId);
          if (!section) return;
          setComposer({ sectionId: section.id, anchor: picked });
          setPanel("comments");
        }}
      />
    </div>
  );
}

/** One section and its sub-sections, so the page body stays readable. */
function SectionView({
  section,
  childSections,
  comments,
  canEdit,
  canComment,
  focusedCommentId,
  editorsByBlock,
  onFocusComment,
  onBlockChange,
  onCommit,
  onFocusBlock,
  onBlockAction,
  onAddInsight,
  documentId,
  editorId,
  nested,
}: {
  section: PlaybookDocumentSection;
  childSections?: PlaybookDocumentSection[];
  comments: PlaybookComment[];
  canEdit: boolean;
  canComment: boolean;
  focusedCommentId: string | null;
  editorsByBlock: Map<string, string>;
  onFocusComment: (commentId: string) => void;
  onBlockChange: (section: PlaybookDocumentSection, blockId: string, body: PlaybookBlockBody) => void;
  onCommit: () => void;
  onFocusBlock: (blockId: string | undefined) => void;
  onBlockAction: (action: () => Promise<unknown>) => Promise<void>;
  onAddInsight: (sectionId: string) => void;
  documentId: string;
  editorId?: string;
  nested?: boolean;
}) {
  /*
    Adjusted during render rather than in an effect: the title is a draft
    seeded from a prop, and re-seeding it after a paint would let one frame of
    the old title through. React's documented recipe for exactly this.
  */
  const [title, setTitle] = useState(section.title);
  const [seededFrom, setSeededFrom] = useState(section.title);
  if (section.title !== seededFrom) {
    setSeededFrom(section.title);
    setTitle(section.title);
  }

  const open = comments.filter(
    (c) => c.sectionId === section.id && c.status === "open" && !c.parentCommentId,
  ).length;

  const Heading = nested ? "h3" : "h2";

  return (
    <section className={cn(nested && "mt-6 border-l border-gray-800 pl-5")}>
      <div
        className={cn(
          "flex items-baseline justify-between gap-3",
          !nested && "border-b border-gray-800 pb-2",
        )}
      >
        {canEdit ? (
          <TitleField
            value={title}
            nested={nested}
            /* Titles save on blur only — a title is finished when you leave
               it, not when you pause typing it. */
            onChange={setTitle}
            onBlur={() => {
              if (!editorId || title.trim() === section.title) return;
              onBlockAction(() =>
                workspaceApi.renameSection({
                  documentId,
                  sectionId: section.id,
                  title,
                  editorId,
                }),
              );
            }}
          />
        ) : (
          <Heading className={cn("font-medium text-gray-50", nested ? "text-base" : "text-lg")}>
            {section.title}
          </Heading>
        )}
        {canComment && (
          <button
            type="button"
            onClick={() => onAddInsight(section.id)}
            className="shrink-0 text-xs text-gray-500 transition-colors hover:text-gray-300"
          >
            {open > 0 ? `${open} open · ` : ""}
            Add insight
          </button>
        )}
      </div>

      <div className={cn("flex flex-col", nested ? "mt-3 gap-3" : "mt-4 gap-3")}>
        {section.blocks.map((block, i) => (
          <EditableBlock
            key={block.id}
            block={block}
            editable={canEdit}
            anchors={anchorsForBlock(block, comments)}
            focusedCommentId={focusedCommentId}
            onFocusComment={onFocusComment}
            presenceLabel={
              editorsByBlock.has(block.id) ? `${editorsByBlock.get(block.id)} is editing` : undefined
            }
            onChange={(body) => onBlockChange(section, block.id, body)}
            onCommit={onCommit}
            onFocusBlock={onFocusBlock}
            canMoveUp={i > 0}
            canMoveDown={i < section.blocks.length - 1}
            onMove={(direction) =>
              editorId &&
              onBlockAction(() =>
                workspaceApi.moveBlock({
                  documentId,
                  sectionId: section.id,
                  blockId: block.id,
                  editorId,
                  direction,
                }),
              )
            }
            onDelete={() =>
              editorId &&
              onBlockAction(() =>
                workspaceApi.deleteBlock({
                  documentId,
                  sectionId: section.id,
                  blockId: block.id,
                  editorId,
                }),
              )
            }
            onInsertAfter={(body) =>
              editorId &&
              onBlockAction(() =>
                workspaceApi.insertBlock({
                  documentId,
                  sectionId: section.id,
                  afterBlockId: block.id,
                  body,
                  editorId,
                }),
              )
            }
          />
        ))}
      </div>

      {childSections?.map((child) => (
        <SectionView
          key={child.id}
          nested
          section={child}
          comments={comments}
          canEdit={canEdit}
          canComment={canComment}
          focusedCommentId={focusedCommentId}
          editorsByBlock={editorsByBlock}
          onFocusComment={onFocusComment}
          onBlockChange={onBlockChange}
          onCommit={onCommit}
          onFocusBlock={onFocusBlock}
          onBlockAction={onBlockAction}
          onAddInsight={onAddInsight}
          documentId={documentId}
          editorId={editorId}
        />
      ))}
    </section>
  );
}
