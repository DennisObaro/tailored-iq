"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Users, BookOpen, FileText, ChevronRight } from "@/components/icons";
import type { Report, Project } from "@/lib/types";
import type { ExpertListing } from "@/lib/api/experts";
import * as reportsApi from "@/lib/api/reports";
import * as projectsApi from "@/lib/api/projects";
import * as expertsApi from "@/lib/api/experts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { RelevantExpertsPanel } from "@/components/expert/relevant-experts-panel";
import { DocumentShell } from "@/components/document/document-shell";
import { DocumentSection, type DocumentSectionSpec } from "@/components/document/document-section";
import {
  DocumentLead,
  DocumentList,
  DocumentNumberedList,
  DocumentProse,
  DocumentTermList,
} from "@/components/document/document-prose";
import { slugify } from "@/components/document/slugify";
import { formatDate } from "@/lib/utils/format";
import { useSessionStore } from "@/lib/store/use-session-store";

export default function ReportDetailPage() {
  const user = useSessionStore((s) => s.user);
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<Report | null | undefined>(undefined);
  const [project, setProject] = useState<Project | null>(null);
  const [experts, setExperts] = useState<ExpertListing[]>([]);
  const [expertsLoading, setExpertsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const viewerId = user.id;
    reportsApi.getReport(reportId, viewerId).then(async (r) => {
      setReport(r);
      if (r) setProject(await projectsApi.getProject(r.projectId, viewerId));
    });
  }, [reportId, user]);

  useEffect(() => {
    if (!user || !report) return;
    let cancelled = false;
    async function loadExperts(clientId: string, r: Report) {
      setExpertsLoading(true);
      const listings = await expertsApi.getRelevantExperts({
        clientId,
        projectId: r.projectId,
        text: [r.problemSummary, ...r.keyConsiderations].join(" "),
      });
      if (cancelled) return;
      setExperts(listings);
      setExpertsLoading(false);
    }
    loadExperts(user.id, report);
    return () => {
      cancelled = true;
    };
  }, [user, report]);

  if (report === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <ErrorState
          whatHappened="We couldn't find this executive summary."
          dataSafe="Nothing has been lost."
        />
      </div>
    );
  }

  const expertsPanel = {
    projectId: project?.id,
    experts,
    loading: expertsLoading,
    emptyMessage: "No expert experience matches this summary yet — we'll surface people as soon as one does.",
  };

  /*
    The document's sections, declared once. The table of contents and the body
    are both rendered from this array, so a section that isn't shown can never
    be listed in the contents — and an executive summary generated with an
    empty field simply loses that heading rather than printing a blank one.
  */
  const sections: DocumentSectionSpec[] = [
    {
      id: "thesis",
      label: "The thesis",
      has: Boolean(report.problemSummary),
      content: <DocumentLead>{report.problemSummary}</DocumentLead>,
    },
    {
      id: "strategic-shift",
      label: "The strategic shift",
      has: report.strategicDirections.length > 0,
      content: <DocumentNumberedList items={report.strategicDirections} />,
    },
    ...report.sections.map((s, i) => ({
      id: slugify(s.heading),
      label: s.heading,
      eyebrow: String(i + 1).padStart(2, "0"),
      has: Boolean(s.body),
      content: <DocumentProse>{s.body}</DocumentProse>,
    })),
    {
      id: "key-considerations",
      label: "Key considerations",
      has: report.keyConsiderations.length > 0,
      content: <DocumentList items={report.keyConsiderations} />,
    },
    {
      id: "frameworks",
      label: "Frameworks",
      has: report.frameworks.length > 0,
      content: <DocumentTermList items={report.frameworks} />,
    },
    {
      id: "risks",
      label: "Risks",
      has: report.risks.length > 0,
      content: <DocumentList items={report.risks} />,
    },
    {
      id: "resources",
      label: "Resources",
      has: report.resources.length > 0,
      content: <DocumentTermList items={report.resources} />,
    },
  ].filter((s) => s.has);

  const header = (
    <header>
      <div className="mb-5 flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/reports" className="hover:text-gray-300">
          Executive summaries
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="text-gray-300">{report.category}</span>
      </div>
      <h1 className="font-document text-[2rem] font-normal leading-tight text-gray-50">
        Executive summary
      </h1>
      {/* A byline rather than a pill — a document says what it is in words. */}
      <p className="mt-2 text-sm text-gray-400">
        {report.category} · Generated {formatDate(report.createdAt)}
      </p>
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
      {sections.map(({ id, label, eyebrow, content }) => (
        <DocumentSection key={id} id={id} label={label} eyebrow={eyebrow}>
          {content}
        </DocumentSection>
      ))}

      {/*
        An action affordance rather than part of the document, so it keeps a
        heading but stays out of the contents — nobody navigates to it.
      */}
      {project && (
        <div className="border-t border-gray-800 pt-10">
          <p className="font-document text-lg font-normal text-gray-50">What&apos;s next?</p>
          <p className="mt-1.5 text-[0.9375rem] leading-7 text-gold">
            Talk to an expert first — their input can strengthen your playbook.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href={`/projects/${project.id}`}>
                <Users className="size-4" aria-hidden />
                View matched experts
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href={`/projects/${project.id}`}>
                <BookOpen className="size-4" aria-hidden />
                Get a playbook
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="gap-1.5">
              <Link href={`/projects/${project.id}`}>
                <FileText className="size-4" aria-hidden />
                Back to project
              </Link>
            </Button>
          </div>
        </div>
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
