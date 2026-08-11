"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Project, Brief, Report } from "@/lib/types";
import * as projectsApi from "@/lib/api/projects";
import * as briefsApi from "@/lib/api/briefs";
import * as reportsApi from "@/lib/api/reports";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";

export default function ExpertProjectViewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    projectsApi.getProject(projectId).then(async (p) => {
      setProject(p);
      if (p?.briefId) setBrief(await briefsApi.getBrief(p.briefId));
      if (p?.reportId) setReport(await reportsApi.getReport(p.reportId));
    });
  }, [projectId]);

  if (project === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <ErrorState whatHappened="We couldn't find this project." dataSafe="Nothing has been lost." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <div className="flex items-center gap-2">
          <StatusBadge status={project.status} />
          {project.category && <Badge variant="outline">{project.category}</Badge>}
        </div>
        <h1 className="mt-2 text-xl font-semibold text-gray-50">{project.title}</h1>
        <p className="mt-2 text-sm text-gray-300">{project.challenge}</p>
      </div>

      {brief && (
        <Card>
          <CardHeader>
            <CardTitle>Brief</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div>
              <p className="text-xs font-medium text-gray-500">Objective</p>
              <p className="text-gray-200">{brief.objective}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Constraints</p>
              <p className="text-gray-200">{brief.constraints}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Desired outcome</p>
              <p className="text-gray-200">{brief.desiredOutcome}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Report summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300">{report.problemSummary}</p>
          </CardContent>
        </Card>
      )}

      {project.consultationId && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-300">Consultation for this project</p>
            <Button asChild size="sm" variant="outline">
              <Link href={`/consultations/${project.consultationId}`}>View</Link>
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-300">Have input that could strengthen this client&apos;s playbook?</p>
          <Button asChild size="sm">
            <Link href={`/expert/contributions/new?projectId=${project.id}`}>Contribute</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
