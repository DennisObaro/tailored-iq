"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { Playbook } from "@/lib/types";
import * as playbooksApi from "@/lib/api/playbooks";
import { useSessionStore } from "@/lib/store/use-session-store";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils/format";

export default function PlaybooksPage() {
  const user = useSessionStore((s) => s.user);
  const [playbooks, setPlaybooks] = useState<Playbook[] | null>(null);

  useEffect(() => {
    if (!user) return;
    playbooksApi.listPlaybooks(user.id).then(setPlaybooks);
  }, [user]);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-50">Playbooks</h1>

      {!playbooks ? (
        <Skeleton className="h-32 w-full" />
      ) : playbooks.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Your playbooks will appear here."
          description="Start with a challenge and turn it into a practical plan."
          action={
            <Button asChild size="sm">
              <Link href="/chat">Start a challenge</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {playbooks.map((p) => (
            <Link key={p.id} href={`/playbooks/${p.id}`}>
              <Card className="flex items-center justify-between p-4 transition-colors hover:bg-gray-850">
                <div>
                  <p className="text-sm font-medium text-gray-50">{p.title}</p>
                  <p className="mt-1 text-xs text-gray-500">Generated {formatDate(p.createdAt)}</p>
                </div>
                <StatusBadge status={p.status} />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
