"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Users, BookOpen, FileText } from "lucide-react";
import type { Report, Project } from "@/lib/types";
import * as reportsApi from "@/lib/api/reports";
import * as projectsApi from "@/lib/api/projects";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";

export default function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<Report | null | undefined>(undefined);
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    reportsApi.getReport(reportId).then(async (r) => {
      setReport(r);
      if (r) setProject(await projectsApi.getProject(r.projectId));
    });
  }, [reportId]);

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
        <ErrorState whatHappened="We couldn't find this report." dataSafe="Nothing has been lost." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <Badge variant="outline">{report.category}</Badge>
        <h1 className="mt-2 text-xl font-semibold text-gray-50">Report</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-300">{report.problemSummary}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Key considerations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-4 text-sm text-gray-300">
            {report.keyConsiderations.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Strategic directions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-4 text-sm text-gray-300">
            {report.strategicDirections.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {report.sections.map((s) => (
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
            {report.frameworks.map((f) => (
              <Badge key={f} variant="outline">
                {f}
              </Badge>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-4 text-sm text-gray-300">
              {report.risks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {project && (
        <Card className="border-primary-500/30 bg-primary-500/5 p-5">
          <p className="text-sm font-medium text-gray-50">What&apos;s next?</p>
          <p className="mt-1 text-sm text-primary-400">
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
        </Card>
      )}
    </div>
  );
}
