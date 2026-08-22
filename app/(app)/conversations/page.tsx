"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessagesSquare } from "@/components/icons";
import type { ConsultationStatus } from "@/lib/types";
import type { ConversationListing } from "@/lib/api/expert-conversations";
import * as conversationsApi from "@/lib/api/expert-conversations";
import { useSessionStore } from "@/lib/store/use-session-store";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRelative, formatCallWhen } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

function previewFor(listing: ConversationListing, viewerId: string | undefined) {
  if (listing.lastMessage) {
    const prefix =
      listing.lastMessage.senderRole === "system"
        ? ""
        : listing.lastMessage.senderId === viewerId
          ? "You: "
          : "";
    return `${prefix}${listing.lastMessage.content}`;
  }
  switch (listing.consultation?.status) {
    case "scheduled":
      return `Call scheduled for ${formatCallWhen(listing.consultation.scheduledFor)}`;
    case "in_call":
      return "Call in progress";
    case "completed":
      return "Call completed";
    default:
      return "No messages yet.";
  }
}

function callActionFor(status: ConsultationStatus): { label: string; variant: "primary" | "outline" } | null {
  switch (status) {
    case "scheduled":
      return { label: "View details", variant: "outline" };
    case "in_call":
      return { label: "Rejoin call", variant: "primary" };
    case "completed":
      return { label: "View summary", variant: "outline" };
    default:
      return null;
  }
}

export default function ConversationsPage() {
  const user = useSessionStore((s) => s.user);
  const [listings, setListings] = useState<ConversationListing[] | null>(null);

  useEffect(() => {
    if (!user) return;
    conversationsApi.listConversationsForUser(user.id).then(setListings);
  }, [user]);

  const isExpertView = user?.activeRole === "expert";

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold text-gray-50">Conversations</h1>
      <p className="mt-1 text-sm text-gray-400">
        {isExpertView
          ? "Clients you're working with — messages and scheduled calls, in one place."
          : "Where you and an expert work through one of your challenges."}
      </p>

      <div className="mt-6">
        {!listings ? (
          <Skeleton className="h-32 w-full" />
        ) : listings.length === 0 ? (
          <EmptyState
            icon={MessagesSquare}
            title="Your conversations will appear here."
            description={
              isExpertView
                ? "When a client engages with you, you'll be able to continue the conversation here."
                : "Connect with an expert to start a conversation around a challenge you're working through."
            }
            action={
              !isExpertView ? (
                <Button asChild size="sm">
                  <Link href="/experts">Explore experts</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {listings.map((listing) => {
              const unread = listing.unreadCount > 0;
              const consultation = listing.consultation;
              const isLive = consultation?.status === "in_call";
              const action = consultation ? callActionFor(consultation.status) : null;
              return (
                <Card
                  key={listing.conversation.id}
                  className={cn(
                    "relative flex items-start gap-3 p-4 transition-colors hover:bg-gray-900",
                    unread && "border-primary-500/30",
                    isLive && "border-primary-500/60",
                  )}
                >
                  <Link
                    href={`/conversations/${listing.conversation.id}`}
                    className="absolute inset-0 z-10"
                    aria-label={`Open conversation with ${listing.counterpart.firstName} ${listing.counterpart.lastName}`}
                  />
                  <Avatar
                    firstName={listing.counterpart.firstName}
                    lastName={listing.counterpart.lastName}
                    src={listing.counterpart.avatarUrl}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("truncate text-sm text-gray-100", unread && "font-medium text-gray-50")}>
                        {listing.counterpart.firstName} {listing.counterpart.lastName}
                      </p>
                      <span className="shrink-0 text-xs text-gray-500">
                        {isLive
                          ? "Live now"
                          : formatRelative(listing.lastMessage?.createdAt ?? listing.conversation.updatedAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-400">{listing.projectTitle}</p>
                    <p className={cn("mt-1.5 truncate text-sm", unread ? "text-gray-200" : "text-gray-500")}>
                      {previewFor(listing, user?.id)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <StatusBadge status={isLive ? "in_call" : listing.stage} />
                      {unread && (
                        <span className="rounded-full bg-primary-500 px-1.5 py-0.5 text-[11px] font-medium text-primary-foreground">
                          {listing.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  {action && consultation && (
                    <Button asChild size="sm" variant={action.variant} className="relative z-20 shrink-0 self-center">
                      <Link href={`/consultations/${consultation.id}`}>{action.label}</Link>
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
