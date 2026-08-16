"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Brief, Project } from "@/lib/types";
import * as projectsApi from "@/lib/api/projects";
import * as briefsApi from "@/lib/api/briefs";
import * as reportsApi from "@/lib/api/reports";
import * as expertsApi from "@/lib/api/experts";
import type { ExpertListing } from "@/lib/api/experts";
import * as playbooksApi from "@/lib/api/playbooks";
import { BookOpen, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { ProjectTimeline } from "@/components/project/project-timeline";
import { ExpertCard } from "@/components/expert/expert-card";
import { formatDate } from "@/lib/utils/format";
import { LOADING_COPY } from "@/lib/constants/loading-copy";
import { useSessionStore } from "@/lib/store/use-session-store";

export default function ProjectDetailPage() {
  const user = useSessionStore((s) => s.user);
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [matchedExperts, setMatchedExperts] = useState<ExpertListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<"report" | "matching" | "playbook" | null>(null);
  const [error, setError] = useState(false);

  const reportRequestedRef = useRef(false);
  const matchRequestedRef = useRef(false);

  async function load() {
    if (!user) return;
    const p = await projectsApi.getProject(projectId, user.id);
    if (!p) {
      // Not this client's project (or gone) — leave the not-found state showing.
      setLoading(false);
      return;
    }
    setProject(p);
    if (p.briefId) setBrief(await briefsApi.getBrief(p.briefId, user.id));
    if (p.matchedExpertIds.length > 0) setMatchedExperts(await expertsApi.getExpertsByIds(p.matchedExpertIds));
    setLoading(false);
  }

  useEffect(() => {
    Promise.resolve().then(() => load());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, user]);

  useEffect(() => {
    if (project?.status === "analysing" && !project.reportId && !reportRequestedRef.current) {
      reportRequestedRef.current = true;
      Promise.resolve()
        .then(() => setStage("report"))
        .then(() => reportsApi.generateReportForProject(project.id))
        .then(() => load())
        .then(() => setStage(null))
        .catch(() => {
          setStage(null);
          setError(true);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  useEffect(() => {
    if (
      project?.status === "report_ready" &&
      project.matchedExpertIds.length === 0 &&
      !matchRequestedRef.current
    ) {
      matchRequestedRef.current = true;
      Promise.resolve()
        .then(() => setStage("matching"))
        .then(() => expertsApi.matchExpertsForProject(project.id))
        .then(() => load())
        .then(() => setStage(null))
        .catch(() => {
          setStage(null);
          setError(true);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  async function getPlaybook() {
    if (!project) return;
    setError(false);
    setStage("playbook");
    try {
      await playbooksApi.generatePlaybookForProject(project.id);
      await load();
    } catch {
      setError(true);
    } finally {
      setStage(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <ErrorState whatHappened="We couldn't find this project." dataSafe="Nothing has been lost." />
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6 p-6 md:grid-cols-[1fr_220px]">
      <div className="flex flex-col gap-6">
        <div>
          <div className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/projects" className="hover:text-gray-300">
              Projects
            </Link>
            <ChevronRight className="size-3" aria-hidden />
            <span className="text-gray-300">{project.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={project.status} />
            {project.category && <Badge variant="outline">{project.category}</Badge>}
          </div>
          <h1 className="mt-2 text-xl font-semibold text-gray-50">{project.title}</h1>
          <p className="mt-1 text-sm text-gray-400">Started {formatDate(project.createdAt)}</p>
        </div>

        {error && (
          <ErrorState
            whatHappened="Something went wrong while processing this step."
            dataSafe="Your brief and progress so far are saved."
            onRetry={() => setError(false)}
          />
        )}

        {project.status === "brief_in_progress" && (
          <Card className="p-4">
            <p className="text-sm text-gray-300">Your challenge is still being diagnosed.</p>
            <Button asChild size="sm" className="mt-3">
              <Link href={`/chat/${project.id}`}>Continue conversation</Link>
            </Button>
          </Card>
        )}

        {brief && (
          <Card>
            <CardHeader>
              <CardTitle>Structured brief</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500">Situation</p>
                <p className="text-gray-200">{brief.situation}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Goal</p>
                <p className="text-gray-200">{brief.objective}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Desired outcome</p>
                <p className="text-gray-200">{brief.desiredOutcome}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {stage === "report" && (
          <Card className="p-4">
            <p className="text-sm text-gray-300">{LOADING_COPY.report[0]}</p>
          </Card>
        )}

        {project.reportId && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-300">Your report is ready.</p>
              <Button asChild size="sm" variant="outline">
                <Link href={`/reports/${project.reportId}`}>Read report</Link>
              </Button>
            </div>
          </Card>
        )}

        {stage === "matching" && (
          <Card className="p-4">
            <p className="text-sm text-gray-300">{LOADING_COPY.matching[0]}</p>
          </Card>
        )}

        {matchedExperts.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-300">Relevant to your challenge</h2>
              {!project.consultationId && (
                <p className="text-xs text-primary-400">
                  Talk to an expert first — their input can strengthen your playbook.
                </p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {matchedExperts.map((listing) => (
                <ExpertCard key={listing.user.id} listing={listing} projectId={project.id} />
              ))}
            </div>
          </div>
        )}

        {stage === "playbook" && (
          <Card className="p-4">
            <p className="text-sm text-gray-300">{LOADING_COPY.playbook[0]}</p>
          </Card>
        )}

        {project.reportId && !project.playbookId && stage !== "playbook" && (
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-300">Turn this report into a practical action plan.</p>
                {!project.consultationId && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    You don&apos;t need to talk to an expert first, but their input can strengthen it.
                  </p>
                )}
              </div>
              <Button size="sm" className="shrink-0 gap-1.5" onClick={getPlaybook}>
                <BookOpen className="size-4" aria-hidden />
                Get a playbook
              </Button>
            </div>
          </Card>
        )}

        {project.playbookId && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-300">Your playbook is ready.</p>
              <Button asChild size="sm" variant="outline">
                <Link href={`/playbooks/${project.playbookId}`}>View playbook</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>

      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">Timeline</p>
        <ProjectTimeline status={project.status} />
      </div>
    </div>
  );
}
