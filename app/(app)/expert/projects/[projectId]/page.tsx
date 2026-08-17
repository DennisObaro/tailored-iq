"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Lock, Lightbulb, FileText } from "@/components/icons";
import type { Brief, Consultation, ExpertContribution, ExpertProfile, Project, Report } from "@/lib/types";
import * as projectsApi from "@/lib/api/projects";
import * as briefsApi from "@/lib/api/briefs";
import * as reportsApi from "@/lib/api/reports";
import * as consultationsApi from "@/lib/api/consultations";
import * as contributionsApi from "@/lib/api/contributions";
import * as opportunitiesApi from "@/lib/api/opportunities";
import * as expertApi from "@/lib/api/expert-onboarding";
import { useSessionStore } from "@/lib/store/use-session-store";
import { getExpertAccess } from "@/lib/utils/expert-access";
import { WILLINGNESS_LABELS } from "@/lib/constants/expert";
import { ExpertGate } from "@/components/expert/expert-gate";
import { ContributionCard } from "@/components/expert/contribution-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { formatCallWhen } from "@/lib/utils/format";

export default function ExpertProjectViewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const user = useSessionStore((s) => s.user);

  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [contributions, setContributions] = useState<ExpertContribution[]>([]);
  const [listing, setListing] = useState<opportunitiesApi.OpportunityListing | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [p, expertProfile, opps, myContributions] = await Promise.all([
        projectsApi.getProject(projectId),
        expertApi.getExpertProfile(user.id),
        opportunitiesApi.listOpportunities(user.id),
        contributionsApi.listContributionsByExpert(user.id),
      ]);
      if (cancelled) return;

      setProject(p);
      setProfile(expertProfile);
      setListing(opps.find((l) => l.opportunity.projectId === projectId) ?? null);
      setContributions(myContributions.filter((c) => c.projectId === projectId));

      /**
       * Client detail is fetched only when this expert is actually engaged
       * on the project — an approved expert with no engagement here still
       * doesn't get the brief.
       */
      const engaged = !!p && p.matchedExpertIds.includes(user.id) && getExpertAccess(expertProfile).canViewClientDetail;
      if (engaged && p) {
        const [b, r, c] = await Promise.all([
          p.briefId ? briefsApi.getBrief(p.briefId, user.id) : Promise.resolve(null),
          p.reportId ? reportsApi.getReport(p.reportId, user.id) : Promise.resolve(null),
          p.consultationId ? consultationsApi.getConsultation(p.consultationId, user.id) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setBrief(b);
        setReport(r);
        setConsultation(c);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, user]);

  if (project === undefined || !user) {
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

  const engaged = project.matchedExpertIds.includes(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <div className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/expert/projects" className="hover:text-gray-300">
            Projects
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span className="text-gray-300">{project.title}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={listing?.stage ?? project.status} />
          {project.category && <Badge variant="outline">{project.category}</Badge>}
        </div>
        <h1 className="mt-2 text-xl font-semibold text-gray-50">{project.title}</h1>
        <p className="mt-2 text-sm text-gray-300">{project.challenge}</p>
      </div>

      {!engaged ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <Lock className="size-5 text-gray-500" aria-hidden />
          <p className="text-sm font-semibold text-gray-50">You aren&apos;t engaged on this project.</p>
          <p className="max-w-sm text-sm text-gray-400">
            Client briefs, reports and transcripts are only available to experts working on the project.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href="/expert/opportunities">Back to opportunities</Link>
          </Button>
        </Card>
      ) : (
        <ExpertGate profile={profile} requires="clientDetail">
          {listing && listing.opportunity.offeredContributions.length > 0 && (
            <Card className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">You agreed to</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {listing.opportunity.offeredContributions.map((c) => (
                  <Badge key={c} variant="primary">
                    {WILLINGNESS_LABELS[c]}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {brief && (
            <Card>
              <CardHeader>
                <CardTitle>The brief</CardTitle>
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
                <CardTitle>What TailoredIQ recommended</CardTitle>
                <p className="text-xs text-gray-500">
                  This is AI-generated analysis. Your job is to say where it&apos;s right, thin, or wrong.
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-gray-300">{report.problemSummary}</p>
                <Button asChild size="sm" variant="outline" className="gap-1.5 self-start">
                  <Link href={`/expert/contributions/new?projectId=${project.id}&type=review`}>
                    <FileText className="size-4" aria-hidden />
                    Review these recommendations
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {consultation && (
            <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm text-gray-100">Consultation</p>
                <p className="text-xs text-gray-500">
                  {formatCallWhen(consultation.scheduledFor)} · <StatusBadge status={consultation.status} />
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/consultations/${consultation.id}`}>
                  {consultation.status === "completed" ? "View summary" : "Open call room"}
                </Link>
              </Button>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Your contributions to this project</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {contributions.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Nothing yet. What you add here goes to the client and, where there&apos;s a playbook, into it.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {contributions.map((c) => (
                    <ContributionCard key={c.id} contribution={c} href={`/expert/contributions/${c.id}`} />
                  ))}
                </div>
              )}
              <Button asChild size="sm" className="gap-1.5 self-start">
                <Link href={`/expert/contributions/new?projectId=${project.id}&type=playbook_input`}>
                  <Lightbulb className="size-4" aria-hidden />
                  Contribute to the playbook
                </Link>
              </Button>
            </CardContent>
          </Card>
        </ExpertGate>
      )}
    </div>
  );
}
