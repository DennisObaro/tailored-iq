"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Playbook } from "@/lib/types";
import * as playbooksApi from "@/lib/api/playbooks";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { PlaybookActionItemRow } from "@/components/playbook/playbook-action-item";

export default function PlaybookDetailPage() {
  const { playbookId } = useParams<{ playbookId: string }>();
  const [playbook, setPlaybook] = useState<Playbook | null | undefined>(undefined);

  useEffect(() => {
    playbooksApi.getPlaybook(playbookId).then(setPlaybook);
  }, [playbookId]);

  async function changeStatus(itemId: string, status: "not_started" | "in_progress" | "done") {
    if (!playbook) return;
    setPlaybook({
      ...playbook,
      actionItems: playbook.actionItems.map((a) => (a.id === itemId ? { ...a, status } : a)),
    });
    await playbooksApi.updateActionItemStatus(playbook.id, itemId, status);
  }

  if (playbook === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!playbook) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <ErrorState whatHappened="We couldn't find this playbook." dataSafe="Nothing has been lost." />
      </div>
    );
  }

  const doneCount = playbook.actionItems.filter((a) => a.status === "done").length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <div className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/playbooks" className="hover:text-gray-300">
            Playbooks
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span className="text-gray-300">{playbook.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={playbook.status} />
          <span className="text-xs text-gray-500">v{playbook.version}</span>
        </div>
        <h1 className="mt-2 text-xl font-semibold text-gray-50">{playbook.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-300">{playbook.executiveSummary}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Key insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-4 text-sm text-gray-300">
            {playbook.keyInsights.map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommended strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-300">{playbook.recommendedStrategy}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Recommended actions</CardTitle>
          <span className="text-xs text-gray-500">
            {doneCount}/{playbook.actionItems.length} done
          </span>
        </CardHeader>
        <CardContent className="flex flex-col">
          {playbook.actionItems.map((item) => (
            <PlaybookActionItemRow
              key={item.id}
              item={item}
              onChangeStatus={(status) => changeStatus(item.id, status)}
            />
          ))}
        </CardContent>
      </Card>

      {playbook.sections.map((s) => (
        <Card key={s.heading}>
          <CardHeader>
            <CardTitle>{s.heading}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-gray-300">{s.body}</p>
          </CardContent>
        </Card>
      ))}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Frameworks</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {playbook.frameworks.map((f) => (
              <Badge key={f} variant="outline">
                {f}
              </Badge>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Risks & considerations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-4 text-sm text-gray-300">
              {playbook.risks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Success measures</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-4 text-sm text-gray-300">
            {playbook.successMeasures.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {playbook.resources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {playbook.resources.map((r) => (
              <Badge key={r} variant="outline">
                {r}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
