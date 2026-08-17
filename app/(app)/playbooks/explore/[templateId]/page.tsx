"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Lock } from "@/components/icons";
import type { PlaybookTemplate } from "@/lib/types";
import * as catalogApi from "@/lib/api/playbook-catalog";
import { useSessionStore } from "@/lib/store/use-session-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { formatCurrency } from "@/lib/utils/format";

export default function PlaybookExplorePage() {
  const { templateId } = useParams<{ templateId: string }>();
  const router = useRouter();
  const user = useSessionStore((s) => s.user);

  const [template, setTemplate] = useState<PlaybookTemplate | null | undefined>(undefined);
  const [ownedPlaybookId, setOwnedPlaybookId] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    catalogApi.getCatalogEntry(templateId).then(setTemplate);
  }, [templateId]);

  useEffect(() => {
    if (!user) return;
    catalogApi.listOwnedTemplates(user.id).then((owned) => {
      const match = owned.find((o) => o.template.id === templateId);
      if (match) setOwnedPlaybookId(match.playbookId);
    });
  }, [user, templateId]);

  useEffect(() => {
    if (ownedPlaybookId) router.replace(`/playbooks/${ownedPlaybookId}`);
  }, [ownedPlaybookId, router]);

  async function unlock() {
    if (!user || !template) return;
    setError(false);
    setUnlocking(true);
    try {
      const playbook = await catalogApi.unlockTemplate(user.id, template.id);
      router.push(`/playbooks/${playbook.id}`);
    } catch {
      setError(true);
    } finally {
      setUnlocking(false);
    }
  }

  if (template === undefined || ownedPlaybookId) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <ErrorState whatHappened="We couldn't find this playbook." dataSafe="Nothing has been lost." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <div className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/playbooks" className="hover:text-gray-300">
            Playbooks
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span className="text-gray-300">{template.title}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Lock className="size-3.5" aria-hidden />
          This playbook is locked. Unlock it to access the full playbook.
        </div>
        <h1 className="mt-2 text-xl font-semibold text-gray-50">{template.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-300">{template.description}</p>
        <Badge variant="outline" className="mt-3 w-fit">
          {template.category}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What&apos;s included</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {template.whatsIncluded.map((item) => (
            <p key={item} className="flex items-center gap-2 text-sm text-gray-300">
              <CheckCircle2 className="size-4 shrink-0 text-primary-400" aria-hidden />
              {item}
            </p>
          ))}
        </CardContent>
      </Card>

      {error && (
        <ErrorState
          whatHappened="We couldn't process that."
          dataSafe="You haven't been charged."
          onRetry={() => setError(false)}
        />
      )}

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <p className="text-2xl font-semibold text-gray-50">{formatCurrency(template.price)}</p>
        <Button size="lg" loading={unlocking} onClick={unlock} className="gap-1.5">
          Unlock playbook
        </Button>
      </div>
    </div>
  );
}
