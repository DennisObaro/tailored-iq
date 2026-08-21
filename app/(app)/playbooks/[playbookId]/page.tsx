"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "@/components/icons";
import type { Playbook } from "@/lib/types";
import type { ExpertListing } from "@/lib/api/experts";
import * as playbooksApi from "@/lib/api/playbooks";
import * as expertsApi from "@/lib/api/experts";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { PlaybookActionItemRow } from "@/components/playbook/playbook-action-item";
import { RelevantExpertsPanel } from "@/components/expert/relevant-experts-panel";
import { DocumentShell } from "@/components/document/document-shell";
import { DocumentSection, type DocumentSectionSpec } from "@/components/document/document-section";
import {
  DocumentLead,
  DocumentList,
  DocumentProse,
  DocumentTermList,
} from "@/components/document/document-prose";
import { slugify } from "@/components/document/slugify";
import { formatDate } from "@/lib/utils/format";
import { useSessionStore } from "@/lib/store/use-session-store";

export default function PlaybookDetailPage() {
  const user = useSessionStore((s) => s.user);
  const { playbookId } = useParams<{ playbookId: string }>();
  const [playbook, setPlaybook] = useState<Playbook | null | undefined>(undefined);
  const [experts, setExperts] = useState<ExpertListing[]>([]);
  const [expertsLoading, setExpertsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    playbooksApi.getPlaybook(playbookId, user.id).then(setPlaybook);
  }, [playbookId, user]);

  /**
   * A catalog-unlocked playbook has no project behind it, so there are no
   * matched experts to reuse — the rail falls back to scoring the playbook's
   * own words. Depends on those words rather than the playbook object so
   * ticking an action item off doesn't re-run the match.
   */
  const matchProjectId = playbook?.projectId;
  const matchText = playbook
    ? [playbook.title, playbook.executiveSummary, ...playbook.keyInsights].join(" ")
    : "";

  useEffect(() => {
    if (!user || !matchText) return;
    let cancelled = false;
    async function loadExperts(clientId: string) {
      setExpertsLoading(true);
      const listings = await expertsApi.getRelevantExperts({
        clientId,
        projectId: matchProjectId,
        text: matchText,
      });
      if (cancelled) return;
      setExperts(listings);
      setExpertsLoading(false);
    }
    loadExperts(user.id);
    return () => {
      cancelled = true;
    };
  }, [user, matchProjectId, matchText]);

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

  const expertsPanel = {
    projectId: playbook.projectId,
    experts,
    loading: expertsLoading,
    emptyMessage: "No expert experience matches this playbook yet — we'll surface people as soon as one does.",
  };

  /*
    The document's sections, declared once. The table of contents and the body
    are both rendered from this array, so the two can't drift apart — and a
    playbook that's still generating (every field empty) drops all of them
    rather than printing a run of blank headings.
  */
  const sections: DocumentSectionSpec[] = [
    {
      id: "executive-summary",
      label: "Executive summary",
      has: Boolean(playbook.executiveSummary),
      content: <DocumentLead>{playbook.executiveSummary}</DocumentLead>,
    },
    {
      id: "key-insights",
      label: "Key insights",
      has: playbook.keyInsights.length > 0,
      content: <DocumentList items={playbook.keyInsights} />,
    },
    {
      id: "recommended-strategy",
      label: "Recommended strategy",
      has: Boolean(playbook.recommendedStrategy),
      content: <DocumentProse>{playbook.recommendedStrategy}</DocumentProse>,
    },
    {
      id: "recommended-actions",
      label: "Recommended actions",
      has: playbook.actionItems.length > 0,
      meta: `${doneCount}/${playbook.actionItems.length} done`,
      content: (
        <div className="flex flex-col">
          {playbook.actionItems.map((item) => (
            <PlaybookActionItemRow
              key={item.id}
              item={item}
              onChangeStatus={(status) => changeStatus(item.id, status)}
            />
          ))}
        </div>
      ),
    },
    ...playbook.sections.map((s) => ({
      id: slugify(s.heading),
      label: s.heading,
      has: Boolean(s.body),
      content: <DocumentProse>{s.body}</DocumentProse>,
    })),
    {
      id: "frameworks",
      label: "Frameworks",
      has: playbook.frameworks.length > 0,
      content: <DocumentTermList items={playbook.frameworks} />,
    },
    {
      id: "risks",
      label: "Risks & considerations",
      has: playbook.risks.length > 0,
      content: <DocumentList items={playbook.risks} />,
    },
    {
      id: "success-measures",
      label: "Success measures",
      has: playbook.successMeasures.length > 0,
      content: <DocumentList items={playbook.successMeasures} />,
    },
    {
      id: "resources",
      label: "Resources",
      has: playbook.resources.length > 0,
      content: <DocumentTermList items={playbook.resources} />,
    },
  ].filter((s) => s.has);

  const header = (
    <header>
      <div className="mb-5 flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/playbooks" className="hover:text-gray-300">
          Playbooks
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="text-gray-300">{playbook.title}</span>
      </div>
      <h1 className="font-document text-[2rem] font-normal leading-tight text-gray-50">
        {playbook.title}
      </h1>
      {/* The status is real state and keeps its badge; the rest is a byline. */}
      <div className="mt-3 flex items-center gap-2.5">
        <StatusBadge status={playbook.status} />
        <span className="text-sm text-gray-400">
          v{playbook.version} · Updated {formatDate(playbook.updatedAt)}
        </span>
      </div>
    </header>
  );

  return (
    <DocumentShell
      contents={sections.map(({ id, label }) => ({ id, label }))}
      header={header}
      aside={
        <RelevantExpertsPanel
          {...expertsPanel}
          className="hidden w-80 shrink-0 overflow-y-auto border-l border-gray-800 p-5 lg:flex"
        />
      }
    >
      {sections.map(({ id, label, meta, content }) => (
        <DocumentSection key={id} id={id} label={label} meta={meta}>
          {content}
        </DocumentSection>
      ))}

      {/* A playbook mid-generation has no content yet — say so rather than showing a bare page. */}
      {sections.length === 0 && (
        <DocumentProse>This playbook is still being generated — check back in a moment.</DocumentProse>
      )}

      {/*
        Narrow screens have no room for the rail, so the same panel falls to
        the end of the document instead of disappearing — on a phone the
        experts are the next thing to do after reading.
      */}
      <RelevantExpertsPanel {...expertsPanel} className="lg:hidden" />
    </DocumentShell>
  );
}
