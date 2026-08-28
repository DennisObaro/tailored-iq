"use client";

import { useState } from "react";
import { Check, X } from "@/components/icons";
import type { PlaybookComment } from "@/lib/types";
import type { WorkspaceCollaborator } from "@/lib/api/playbook-workspace";
import { CONTRIBUTION_LABELS } from "@/lib/constants/playbook-workspace";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export interface CommentThread {
  comment: PlaybookComment;
  replies: PlaybookComment[];
  /** False when the passage this quotes has been edited away. */
  anchored: boolean;
  sectionTitle?: string;
}

function Author({ collaborator }: { collaborator?: WorkspaceCollaborator }) {
  return (
    <>
      {collaborator && (
        <Avatar
          firstName={collaborator.user.firstName}
          lastName={collaborator.user.lastName}
          src={collaborator.user.avatarUrl}
          size="sm"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-gray-100">
          {collaborator ? `${collaborator.user.firstName} ${collaborator.user.lastName}` : "Expert"}
        </p>
        <p className="truncate text-xs text-gray-500">{collaborator?.role}</p>
      </div>
    </>
  );
}

/**
 * One conversation about one passage.
 *
 * The quote sits above the comment because a comment read out of context is
 * an opinion about nothing — and once the Scribe has edited the passage away,
 * saying so plainly is the only honest option left. The alternative, quietly
 * dropping the thread, would delete an expert's argument because someone
 * reworded a sentence.
 */
export function CommentThreadCard({
  thread,
  collaborators,
  canCurate,
  canReply,
  busy,
  focused,
  onFocus,
  onCurate,
  onReply,
}: {
  thread: CommentThread;
  collaborators: WorkspaceCollaborator[];
  canCurate: boolean;
  canReply: boolean;
  busy: boolean;
  focused: boolean;
  onFocus: () => void;
  onCurate: (status: "accepted" | "rejected" | "resolved") => void;
  onReply: (content: string) => Promise<void>;
}) {
  const { comment, replies } = thread;
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const [open, setOpen] = useState(false);

  const author = collaborators.find((c) => c.collaborator.expertId === comment.expertId);

  async function submitReply() {
    if (!reply.trim()) return;
    setReplying(true);
    try {
      await onReply(reply.trim());
      setReply("");
      setOpen(false);
    } finally {
      setReplying(false);
    }
  }

  return (
    <Card
      onClick={onFocus}
      className={cn(
        "flex cursor-pointer flex-col gap-2 p-3 transition-colors",
        focused ? "border-gray-600 bg-gray-900" : "hover:bg-gray-900",
      )}
    >
      <div className="flex items-start gap-2">
        <Author collaborator={author} />
        <StatusBadge status={comment.status} variant="bare" />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline">{CONTRIBUTION_LABELS[comment.kind]}</Badge>
        {!comment.blockId && thread.sectionTitle && (
          <span className="text-xs text-gray-500">{thread.sectionTitle}</span>
        )}
      </div>

      {comment.quote &&
        (thread.anchored ? (
          <p className="border-l-2 border-gold/40 pl-2 text-xs italic leading-relaxed text-gray-400">
            {comment.quote}
          </p>
        ) : (
          <div className="border-l-2 border-gray-800 pl-2">
            <p className="text-xs italic leading-relaxed text-gray-600 line-through">{comment.quote}</p>
            <p className="mt-0.5 text-xs text-gray-500">The text this refers to has changed.</p>
          </div>
        ))}

      <p className="text-xs leading-relaxed text-gray-300">{comment.content}</p>
      <p className="text-xs text-gray-500">{formatRelative(comment.createdAt)}</p>

      {replies.length > 0 && (
        <div className="flex flex-col gap-2 border-l border-gray-800 pl-2.5">
          {replies.map((r) => {
            const replyAuthor = collaborators.find((c) => c.collaborator.expertId === r.expertId);
            return (
              <div key={r.id}>
                <div className="flex items-start gap-2">
                  <Author collaborator={replyAuthor} />
                </div>
                <p className="mt-1 text-xs leading-relaxed text-gray-300">{r.content}</p>
                <p className="mt-0.5 text-xs text-gray-500">{formatRelative(r.createdAt)}</p>
              </div>
            );
          })}
        </div>
      )}

      {canCurate && comment.status === "open" && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <Button size="sm" variant="outline" loading={busy} onClick={() => onCurate("accepted")} className="gap-1">
            <Check className="size-3.5" aria-hidden />
            Accept
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onCurate("rejected")} className="gap-1">
            <X className="size-3.5" aria-hidden />
            Reject
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onCurate("resolved")}>
            Resolve
          </Button>
        </div>
      )}

      {canReply &&
        (open ? (
          <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={2}
              autoFocus
              placeholder="Reply…"
              className="resize-none rounded-md border border-gray-800 bg-gray-950 p-2 text-xs leading-relaxed text-gray-100 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            />
            <div className="flex gap-1.5">
              <Button size="sm" loading={replying} disabled={!reply.trim()} onClick={submitReply}>
                Reply
              </Button>
              <Button size="sm" variant="ghost" disabled={replying} onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
            className="self-start text-xs text-gray-500 hover:text-gray-300"
          >
            Reply
          </button>
        ))}
    </Card>
  );
}
