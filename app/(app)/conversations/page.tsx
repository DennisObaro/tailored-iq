"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessagesSquare } from "@/components/icons";
import type { Consultation, User } from "@/lib/types";
import * as consultationsApi from "@/lib/api/consultations";
import * as usersApi from "@/lib/api/users";
import { useSessionStore } from "@/lib/store/use-session-store";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils/format";

export default function ConversationsPage() {
  const user = useSessionStore((s) => s.user);
  const [consultations, setConsultations] = useState<Consultation[] | null>(null);
  const [experts, setExperts] = useState<Record<string, User>>({});

  useEffect(() => {
    if (!user) return;
    consultationsApi.listConsultationsForClient(user.id).then(async (list) => {
      setConsultations(list);
      const uniqueIds = [...new Set(list.map((c) => c.expertId))];
      const users = await Promise.all(uniqueIds.map((id) => usersApi.getUser(id)));
      const map: Record<string, User> = {};
      users.forEach((u) => {
        if (u) map[u.id] = u;
      });
      setExperts(map);
    });
  }, [user]);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-50">Conversations</h1>

      {!consultations ? (
        <Skeleton className="h-32 w-full" />
      ) : consultations.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No expert conversations yet."
          description="Once we match you with relevant experience, your conversations will appear here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {consultations.map((c) => {
            const expert = experts[c.expertId];
            return (
              <Link key={c.id} href={`/consultations/${c.id}`}>
                <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-gray-900">
                  {expert && <Avatar firstName={expert.firstName} lastName={expert.lastName} />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-100">
                      {expert ? `${expert.firstName} ${expert.lastName}` : "Expert"}
                    </p>
                    <p className="text-xs text-gray-500">{formatDateTime(c.scheduledFor)}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
