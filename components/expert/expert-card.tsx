"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StarFilled } from "@/components/icons";
import type { ExpertListing } from "@/lib/api/experts";
import * as conversationsApi from "@/lib/api/expert-conversations";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaveExpertButton } from "@/components/expert/save-expert-button";
import { useSessionStore } from "@/lib/store/use-session-store";
import { useSavedExpertsStore } from "@/lib/store/use-saved-experts-store";
import { cn } from "@/lib/utils/cn";

/**
 * The one card an expert is shown on — a rail beside a summary, a grid of
 * matches, the directory. Wherever they appear, the same three things are
 * offered: open a conversation, read the profile, keep them for later. A
 * client shouldn't have to learn which list gives them which.
 */
export function ExpertCard({
  listing,
  projectId,
  reason,
  truncateReason = false,
}: {
  listing: ExpertListing;
  projectId?: string;
  reason?: string;
  /** Clamps the reason chip to one line and stretches it full-width instead of hugging the text. */
  truncateReason?: boolean;
}) {
  const router = useRouter();
  const viewer = useSessionStore((s) => s.user);
  const savedIds = useSavedExpertsStore((s) => s.ids);
  const loadSaved = useSavedExpertsStore((s) => s.load);
  const setSaved = useSavedExpertsStore((s) => s.setSaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, profile } = listing;
  const params = new URLSearchParams();
  if (projectId) params.set("projectId", projectId);
  if (reason) params.set("reason", reason);
  const query = params.toString();
  const href = `/experts/${user.id}${query ? `?${query}` : ""}`;

  /**
   * Only a client engages an expert. An expert reading a summary they're
   * matched on reaches these cards too, and offering them a conversation with
   * themselves — or a bookmark on a peer — is an action that could never
   * succeed. They still get the profile.
   */
  const canEngage = !!viewer?.roles.includes("client") && viewer.id !== user.id;
  const saved = savedIds.includes(user.id);

  useEffect(() => {
    if (canEngage && viewer) loadSaved(viewer.id);
  }, [canEngage, viewer, loadSaved]);

  /**
   * With a challenge in hand this opens the thread about it directly. Without
   * one — the directory, a catalog playbook — it falls back to the profile,
   * where the client is asked which challenge it concerns.
   */
  async function talk() {
    if (!viewer || !projectId) {
      router.push(href);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const conversation = await conversationsApi.getOrCreateConversation({
        clientId: viewer.id,
        expertId: user.id,
        projectId,
      });
      router.push(`/conversations/${conversation.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work. Try again.");
      setBusy(false);
    }
  }

  return (
    <Link href={href} className="block h-full">
      <Card className="flex h-full flex-col gap-3 border-gray-900 p-4 transition-colors hover:bg-gray-900">
        {reason && (
          <p
            className={cn(
              "text-xs font-medium uppercase tracking-wide text-gray-500",
              truncateReason && "truncate",
            )}
          >
            {reason}
          </p>
        )}
        <div className="flex items-start gap-3">
          <Avatar
            firstName={user.firstName}
            lastName={user.lastName}
            src={user.avatarUrl}
            size="lg"
            online={profile.isOnline}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-50">
              {user.firstName} {user.lastName}
            </p>
            {/* Wraps rather than truncates: the rail is narrow and a role cut
              mid-word tells the client less than two short lines do. */}
          <p className="line-clamp-2 text-xs text-gray-400">{profile.currentRole}</p>
          </div>
          {/* Standing reads as part of who they are, so it sits with the name
              rather than down in the actions. */}
          <span className="flex shrink-0 items-center gap-1 text-xs text-gray-500">
            {profile.reviewCount > 0 ? (
              <>
                <StarFilled className="size-3" aria-hidden />
                {profile.rating.toFixed(1)}
                <span>({profile.reviewCount})</span>
              </>
            ) : (
              "New"
            )}
          </span>
        </div>
        <p className="text-xs font-medium text-gray-300">{profile.yearsExperience} years of operating experience</p>
        <div className="flex flex-wrap gap-1.5">
          {profile.expertiseTags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {/* One row, deliberately un-wrapped: the narrowest card this renders in
            is a 320px rail, and all three have to stay on the line together —
            a bookmark dropped onto a row of its own reads as a third action
            rather than the quiet aside it is. Hence the smaller type, and a
            long first name truncating rather than pushing the rest off. */}
        <div className="mt-auto flex items-center gap-1.5 pt-1">
          {canEngage && (
            <Button
              size="sm"
              variant="outline"
              loading={busy}
              className="min-w-0 px-2.5 text-xs"
              // The whole tile is a link to the profile; without these, talking
              // would navigate there instead.
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void talk();
              }}
            >
              <span className="truncate">Talk to {user.firstName}</span>
            </Button>
          )}
          {/* A span, not a link: the card itself already goes here, and a
              nested anchor would be invalid markup. */}
          <Button asChild size="sm" variant="ghost" className="shrink-0 px-2.5 text-xs">
            <span>View profile</span>
          </Button>
          {canEngage && viewer && (
            <SaveExpertButton
              className="ml-auto"
              saved={saved}
              onToggle={(next) => void setSaved(viewer.id, user.id, next)}
              name={`${user.firstName} ${user.lastName}`}
            />
          )}
        </div>
      </Card>
    </Link>
  );
}
