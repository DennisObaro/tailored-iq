"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, ChevronDown, Clock, Sparkles, X } from "@/components/icons";
import type { LiveBriefNotification } from "@/lib/api/live-briefs";
import * as liveBriefsApi from "@/lib/api/live-briefs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils/cn";

/** Beyond this the stack starts covering the dashboard rather than sitting above it. */
const MAX_VISIBLE = 2;
/** How long "Brief accepted" stays up before the card retires itself. */
const ACCEPTED_LINGER_MS = 1800;

type Resolution = "accepted" | "declined" | "dismissed";

function timeLeft(expiresAt: string, now: number) {
  const remaining = Math.max(0, new Date(expiresAt).getTime() - now);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function LiveBriefCard({
  brief,
  now,
  expertId,
  onResolved,
  onAccepted,
}: {
  brief: LiveBriefNotification;
  now: number;
  expertId: string;
  onResolved: (projectId: string) => void;
  onAccepted?: (projectId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accepted) return;
    const timer = setTimeout(() => onResolved(brief.projectId), ACCEPTED_LINGER_MS);
    return () => clearTimeout(timer);
  }, [accepted, brief.projectId, onResolved]);

  async function resolve(action: Resolution) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (action === "accepted") {
        await liveBriefsApi.acceptLiveBrief(brief.projectId, expertId);
        setAccepted(true);
        // The brief is a project now — whoever is showing Active Projects
        // needs to hear about it, not wait for the next page load.
        onAccepted?.(brief.projectId);
        return;
      }
      if (action === "declined") await liveBriefsApi.declineLiveBrief(brief.projectId, expertId);
      else await liveBriefsApi.dismissLiveBrief(brief.projectId, expertId);
      onResolved(brief.projectId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work. Try again.");
      setBusy(false);
    }
  }

  if (accepted) {
    return (
      <Card className="flex items-center gap-2.5 border-success-500/30 bg-success-500/5 p-4">
        <Check className="size-4 shrink-0 text-success" aria-hidden />
        <p className="text-sm font-medium text-gray-100">Brief accepted</p>
        <p className="text-sm text-gray-400">It&apos;s in your active projects.</p>
      </Card>
    );
  }

  return (
    <Card className="border-primary-500/30 bg-primary-500/5 p-4 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 shrink-0 text-gold" aria-hidden />
          <p className="text-xs font-medium uppercase tracking-wide text-gold">New client brief</p>
          {brief.category && <Badge variant="outline">{brief.category}</Badge>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex items-center gap-1 text-xs tabular-nums text-gray-500">
            <Clock className="size-3" aria-hidden />
            {timeLeft(brief.expiresAt, now)}
          </span>
          <button
            type="button"
            onClick={() => resolve("dismissed")}
            disabled={busy}
            aria-label="Close this notification"
            className="flex size-6 items-center justify-center rounded-md text-gray-500 hover:bg-gray-900 hover:text-gray-200 disabled:opacity-50"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>

      {/* The body is the disclosure control: reading more shouldn't cost a
          click on something that looks like a button. */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="mt-2 flex w-full items-start gap-2 text-left"
      >
        <span className="flex-1">
          <span className="block text-sm text-gray-400">A client has a challenge that may interest you.</span>
          <span className="mt-1 block text-sm font-medium leading-relaxed text-gray-50">
            &ldquo;{brief.headline}&rdquo;
          </span>
        </span>
        <ChevronDown
          className={cn("mt-0.5 size-4 shrink-0 text-gray-500 transition-transform", expanded && "rotate-180")}
          aria-hidden
        />
      </button>

      {expanded && (
        <div className="mt-3 flex flex-col gap-3 border-t border-primary-500/20 pt-3">
          <div>
            <p className="text-xs font-medium text-gray-500">Full question</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-300">{brief.fullQuestion}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div>
              <p className="text-xs font-medium text-gray-500">Challenge</p>
              <p className="mt-0.5 text-sm text-gray-300">{brief.title}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Where it&apos;s got to</p>
              <span className="mt-1 block">
                <StatusBadge status={brief.stage} />
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Your experience may be relevant to this challenge. Accepting lets you start on a playbook — other
            experts can be working on it too, and the client chooses who they speak with.
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" loading={busy} onClick={() => resolve("accepted")} className="gap-1.5">
          Jump on brief
          <ArrowRight className="size-4" aria-hidden />
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => resolve("declined")}>
          Decline
        </Button>
      </div>
    </Card>
  );
}

/**
 * The live-brief area at the very top of the expert dashboard.
 *
 * Separate from New opportunities on purpose: an opportunity is a curated
 * match on a brief the client has finished, this is the raw "somebody just
 * asked something" ping that goes to everyone while it's still forming. It
 * stacks rather than covers — past a couple of cards the rest are counted,
 * not stacked, so the dashboard underneath stays usable.
 */
export function LiveBriefStack({
  briefs,
  expertId,
  onAccepted,
  className,
}: {
  briefs: LiveBriefNotification[];
  expertId: string;
  /** Fires once the brief has become one of this expert's projects. */
  onAccepted?: (projectId: string) => void;
  className?: string;
}) {
  const [resolved, setResolved] = useState<string[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const visible = briefs.filter((b) => !resolved.includes(b.projectId));
  if (visible.length === 0) return null;

  const shown = visible.slice(0, MAX_VISIBLE);
  const overflow = visible.length - shown.length;

  return (
    <section aria-label="New client briefs" className={cn("flex flex-col gap-2", className)}>
      <div aria-live="polite" className="flex flex-col gap-2">
        {shown.map((brief) => (
          <LiveBriefCard
            key={brief.participation.id}
            brief={brief}
            now={now}
            expertId={expertId}
            onResolved={(projectId) => setResolved((r) => [...r, projectId])}
            onAccepted={onAccepted}
          />
        ))}
      </div>
      {overflow > 0 && (
        <p className="text-xs text-gray-500">
          {overflow} more client brief{overflow === 1 ? "" : "s"} came in — they&apos;re in your notifications.
        </p>
      )}
    </section>
  );
}
