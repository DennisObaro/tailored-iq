"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { Playbook, PlaybookTemplate } from "@/lib/types";
import * as playbooksApi from "@/lib/api/playbooks";
import * as catalogApi from "@/lib/api/playbook-catalog";
import { useSessionStore } from "@/lib/store/use-session-store";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaybookCatalogCard } from "@/components/playbook/playbook-catalog-card";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { key: "mine", label: "My Playbooks" },
  { key: "explore", label: "Explore" },
] as const;

export default function PlaybooksPage() {
  const user = useSessionStore((s) => s.user);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("mine");

  const [playbooks, setPlaybooks] = useState<Playbook[] | null>(null);
  const [catalog, setCatalog] = useState<PlaybookTemplate[] | null>(null);
  const [owned, setOwned] = useState<catalogApi.OwnedTemplate[] | null>(null);
  const [recommended, setRecommended] = useState<catalogApi.RecommendedTemplatesResult | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([playbooksApi.listPlaybooks(user.id), catalogApi.listOwnedTemplates(user.id)]).then(
      async ([generated, ownedTemplates]) => {
        setOwned(ownedTemplates);
        const ownedPlaybooks = await Promise.all(
          ownedTemplates.map((o) => playbooksApi.getPlaybook(o.playbookId)),
        );
        const merged = [...generated, ...ownedPlaybooks.filter((p): p is Playbook => p !== null)].sort((a, b) =>
          a.createdAt < b.createdAt ? 1 : -1,
        );
        setPlaybooks(merged);
      },
    );
  }, [user]);

  useEffect(() => {
    catalogApi.listCatalog().then(setCatalog);
  }, []);

  useEffect(() => {
    if (!user) return;
    catalogApi.getRecommendedTemplates(user.id).then(setRecommended);
  }, [user]);

  const ownedTemplateIds = new Map((owned ?? []).map((o) => [o.template.id, o.playbookId]));

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-50">Playbooks</h1>

      <div className="mb-6 inline-flex rounded-lg border border-gray-800 bg-gray-950 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
              tab === t.key ? "bg-gray-900 text-gray-50" : "text-gray-400 hover:text-gray-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "mine" ? (
        !playbooks ? (
          <Skeleton className="h-32 w-full" />
        ) : playbooks.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Your playbooks will appear here."
            description="Start with a business challenge and TailoredIQ will help turn it into a practical, expert-informed plan."
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
                <Card className="flex items-center justify-between p-4 transition-colors hover:bg-gray-900">
                  <div>
                    <p className="text-sm font-medium text-gray-50">{p.title}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {p.projectId ? "Generated" : "Unlocked"} {formatDate(p.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </Card>
              </Link>
            ))}
          </div>
        )
      ) : !catalog ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <div>
          {recommended && recommended.recommendations.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-medium text-gray-300">Recommended for you</h2>
              <p className="mt-1 text-xs text-gray-400">Based on the challenges you&apos;ve been working through.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {recommended.recommendations.map((r) => (
                  <PlaybookCatalogCard
                    key={r.template.id}
                    template={r.template}
                    owned={ownedTemplateIds.has(r.template.id)}
                    playbookId={ownedTemplateIds.get(r.template.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <h2 className="text-sm font-medium text-gray-300">Explore playbooks</h2>
          <p className="mt-1 text-xs text-gray-400">
            Practical guidance built from the experience of leaders who have solved similar challenges.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {catalog.map((template) => (
              <PlaybookCatalogCard
                key={template.id}
                template={template}
                owned={ownedTemplateIds.has(template.id)}
                playbookId={ownedTemplateIds.get(template.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
