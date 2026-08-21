"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessagesSquare } from "@/components/icons";
import type { ConversationListing } from "@/lib/api/expert-conversations";
import * as conversationsApi from "@/lib/api/expert-conversations";
import { useSessionStore } from "@/lib/store/use-session-store";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export default function ConversationsPage() {
  const user = useSessionStore((s) => s.user);
  const [listings, setListings] = useState<ConversationListing[] | null>(null);

  useEffect(() => {
    if (!user) return;
    conversationsApi.listConversationsForUser(user.id).then(setListings);
  }, [user]);

  const isExpertView = listings?.some((l) => l.conversation.expertId === user?.id) ?? false;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold text-gray-50">Conversations</h1>
      <p className="mt-1 text-sm text-gray-400">
        {isExpertView
          ? "Clients you're working with, and the challenge behind each one."
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
              return (
                <Link key={listing.conversation.id} href={`/conversations/${listing.conversation.id}`}>
                  <Card
                    className={cn(
                      "flex items-start gap-3 p-4 transition-colors hover:bg-gray-900",
                      // Unread leans on weight and the existing gold accent rather
                      // than a new colour — the same cue the rest of the app uses.
                      unread && "border-primary-500/30",
                    )}
                  >
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
                          {formatRelative(listing.lastMessage?.createdAt ?? listing.conversation.updatedAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-gray-400">{listing.projectTitle}</p>
                      <p
                        className={cn(
                          "mt-1.5 truncate text-sm",
                          unread ? "text-gray-200" : "text-gray-500",
                        )}
                      >
                        {listing.lastMessage
                          ? `${listing.lastMessage.senderRole === "system" ? "" : listing.lastMessage.senderId === user?.id ? "You: " : ""}${listing.lastMessage.content}`
                          : "No messages yet."}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <StatusBadge status={listing.stage} />
                        {unread && (
                          <span className="rounded-full bg-primary-500 px-1.5 py-0.5 text-[11px] font-medium text-primary-foreground">
                            {listing.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
