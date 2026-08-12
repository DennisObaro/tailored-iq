"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ThumbsUp, ThumbsDown, ChevronRight } from "lucide-react";
import type { Opportunity, Project } from "@/lib/types";
import * as opportunitiesApi from "@/lib/api/opportunities";
import * as projectsApi from "@/lib/api/projects";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";

const CONTRIBUTION_LABELS: Record<string, string> = {
  review: "Review",
  contribute_insight: "Contribute insight",
  advisory_call: "Advisory call",
  playbook_contribution: "Playbook contribution",
  longer_engagement: "Longer engagement",
};

export default function OpportunityDetailPage() {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<Opportunity | null | undefined>(undefined);
  const [project, setProject] = useState<Project | null>(null);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    opportunitiesApi.getOpportunity(opportunityId).then(async (o) => {
      setOpportunity(o);
      if (o) setProject(await projectsApi.getProject(o.projectId));
    });
  }, [opportunityId]);

  async function respond(response: "interested" | "not_for_me") {
    if (!opportunity) return;
    setResponding(true);
    const updated = await opportunitiesApi.respondToOpportunity(opportunity.id, response);
    setOpportunity(updated);
    setResponding(false);
    if (response === "interested") {
      setTimeout(() => router.push(`/expert/projects/${opportunity.projectId}`), 600);
    }
  }

  if (opportunity === undefined) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <ErrorState whatHappened="We couldn't find this opportunity." dataSafe="Nothing has been lost." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <div className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/expert/opportunities" className="hover:text-gray-300">
            Opportunities
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span className="text-gray-300">{opportunity.title}</span>
        </div>
        <Badge variant="outline">{opportunity.category}</Badge>
        <h1 className="mt-2 text-xl font-semibold text-gray-50">{opportunity.title}</h1>
        <p className="mt-2 text-sm text-gray-300">{opportunity.summary}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Why you&apos;re relevant</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-300">{opportunity.relevanceReason}</p>
        </CardContent>
      </Card>

      {project?.category && (
        <Card>
          <CardHeader>
            <CardTitle>The challenge</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300">{project.challenge}</p>
          </CardContent>
        </Card>
      )}

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Requested contribution</p>
        <div className="flex flex-wrap gap-1.5">
          {opportunity.requestedContributions.map((c) => (
            <Badge key={c}>{CONTRIBUTION_LABELS[c] ?? c}</Badge>
          ))}
        </div>
      </div>

      {opportunity.response ? (
        <Card className="p-4">
          <p className="text-sm text-gray-300">
            You marked this opportunity as{" "}
            <span className="font-medium text-gray-100">
              {opportunity.response === "interested" ? "interested" : "not for me"}
            </span>
            .
          </p>
        </Card>
      ) : (
        <div className="flex gap-2">
          <Button className="gap-1.5" loading={responding} onClick={() => respond("interested")}>
            <ThumbsUp className="size-4" aria-hidden />
            Interested
          </Button>
          <Button variant="outline" className="gap-1.5" loading={responding} onClick={() => respond("not_for_me")}>
            <ThumbsDown className="size-4" aria-hidden />
            Not for me
          </Button>
        </div>
      )}
    </div>
  );
}
