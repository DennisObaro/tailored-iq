"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Star, ExternalLink, Calendar } from "lucide-react";
import * as expertsApi from "@/lib/api/experts";
import type { ExpertListing } from "@/lib/api/experts";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { formatDateTime } from "@/lib/utils/format";

export default function ExpertProfilePage() {
  const { expertId } = useParams<{ expertId: string }>();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [listing, setListing] = useState<ExpertListing | null | undefined>(undefined);

  useEffect(() => {
    expertsApi.getExpert(expertId).then(setListing);
  }, [expertId]);

  if (listing === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <ErrorState whatHappened="We couldn't find this expert." dataSafe="Nothing has been lost." />
      </div>
    );
  }

  const { user, profile } = listing;

  return (
    <div className="mx-auto grid max-w-3xl gap-6 p-6 md:grid-cols-[1fr_260px]">
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <Avatar firstName={user.firstName} lastName={user.lastName} src={user.avatarUrl} size="xl" />
          <div>
            <h1 className="text-xl font-semibold text-gray-50">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-sm text-gray-400">{profile.currentRole}</p>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1 text-primary-400">
                <Star className="size-3.5 fill-current" aria-hidden />
                {profile.rating.toFixed(1)} ({profile.reviewCount} reviews)
              </span>
              <span>{profile.totalProjects} projects</span>
              {profile.linkedinUrl && (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-gray-400 hover:text-gray-200"
                >
                  LinkedIn <ExternalLink className="size-3" aria-hidden />
                </a>
              )}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-gray-300">{profile.bio}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Areas of expertise</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {profile.expertiseTags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Industry experience</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {profile.industries.map((i) => (
              <Badge key={i}>{i}</Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Consultation</p>
          <p className="mt-1 text-lg font-semibold text-gray-50">${profile.consultationRate}<span className="text-sm font-normal text-gray-500">/session</span></p>
          <p className="mt-1 text-xs text-gray-400">{profile.yearsExperience} years of experience &middot; {profile.expertLevel}</p>
          <Button asChild className="mt-4 w-full justify-center gap-1.5">
            <Link href={projectId ? `/experts/${user.id}/book?projectId=${projectId}` : `/experts/${user.id}/book`}>
              <Calendar className="size-4" aria-hidden />
              Book a consultation
            </Link>
          </Button>
        </Card>

        {profile.availabilitySlots.length > 0 && (
          <Card className="p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Availability</p>
            <div className="flex flex-col gap-1.5">
              {profile.availabilitySlots.slice(0, 4).map((slot) => (
                <p key={slot} className="text-xs text-gray-300">
                  {formatDateTime(slot)}
                </p>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
