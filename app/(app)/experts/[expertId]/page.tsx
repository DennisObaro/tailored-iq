"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Star, StarFilled, ExternalLink, Calendar, ChevronRight } from "@/components/icons";
import * as expertsApi from "@/lib/api/experts";
import type { ExpertListing } from "@/lib/api/experts";
import * as consultationsApi from "@/lib/api/consultations";
import type { ReviewListing } from "@/lib/api/consultations";
import * as contributionsApi from "@/lib/api/contributions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { formatCallWhen, formatRelative, formatCurrency } from "@/lib/utils/format";
import { helpAreaLabel } from "@/lib/constants/expert";

export default function ExpertProfilePage() {
  const { expertId } = useParams<{ expertId: string }>();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const reason = searchParams.get("reason");

  const [listing, setListing] = useState<ExpertListing | null | undefined>(undefined);
  const [advisoryCount, setAdvisoryCount] = useState<number | null>(null);
  const [contributionCount, setContributionCount] = useState<number | null>(null);
  const [reviews, setReviews] = useState<ReviewListing[] | null>(null);

  useEffect(() => {
    expertsApi.getExpert(expertId).then(setListing);
  }, [expertId]);

  useEffect(() => {
    consultationsApi.listConsultationsForExpert(expertId).then((consultations) => {
      setAdvisoryCount(consultations.filter((c) => c.status === "completed").length);
    });
    contributionsApi.listContributionsByExpert(expertId).then((contributions) => {
      setContributionCount(contributions.length);
    });
    consultationsApi.listReviewsForExpert(expertId).then(setReviews);
  }, [expertId]);

  if (listing === undefined) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <ErrorState whatHappened="We couldn't find this expert." dataSafe="Nothing has been lost." />
      </div>
    );
  }

  const { user, profile } = listing;
  /**
   * What this expert can help with, in the client's terms: the problems
   * they selected during onboarding, falling back to expertise areas for
   * profiles created before help areas existed.
   */
  const helpItems =
    profile.helpAreas.length > 0
      ? profile.helpAreas.map(helpAreaLabel)
      : profile.expertise.length > 0
        ? profile.expertise.map((e) => e.label)
        : profile.expertiseTags;
  const hasAvailability = profile.availabilitySlots.length > 0;
  const bookHref = projectId ? `/experts/${user.id}/book?projectId=${projectId}` : `/experts/${user.id}/book`;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/experts" className="hover:text-gray-300">
          Experts
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="text-gray-300">
          {user.firstName} {user.lastName}
        </span>
      </div>

      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <Avatar firstName={user.firstName} lastName={user.lastName} src={user.avatarUrl} size="2xl" shape="square" />
            {profile.isOnline && (
              <span className="absolute -bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-gray-800 bg-gray-950 px-2 py-0.5 text-[10px] font-medium text-gray-300">
                <span className="size-1.5 rounded-full bg-success-500" aria-hidden />
                Online now
              </span>
            )}
          </div>
          <div className="pt-1">
            {reason && (
              <Badge variant="primary" className="mb-1.5 w-fit">
                {reason}
              </Badge>
            )}
            <h1 className="text-2xl font-semibold text-gray-50">
              {user.firstName} {user.lastName}
            </h1>
            <p className="mt-1 text-sm text-gray-400">{profile.currentRole}</p>
            <p className="mt-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 align-middle text-gray-300">
                {profile.reviewCount > 0 ? (
                  <>
                    <StarFilled className="size-3.5 text-primary-400" aria-hidden />
                    {profile.rating.toFixed(1)} from {profile.reviewCount} reviews
                  </>
                ) : (
                  "New · no reviews yet"
                )}
              </span>
              <span className="mx-1.5" aria-hidden>
                &middot;
              </span>
              <span className="font-medium text-gray-300">{profile.yearsExperience} years</span> operating
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {helpItems.map((item) => (
                <Badge key={item} variant="outline">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {profile.linkedinUrl && (
          <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5">
            <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">
              LinkedIn <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <div className="flex flex-col gap-6">
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
              <CardTitle>Experience highlights</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 divide-x divide-gray-800 p-0">
              <div className="p-4 text-center">
                <p className="text-lg font-semibold text-gray-50">{profile.yearsExperience}</p>
                <p className="mt-1 text-xs text-gray-500">Years of experience</p>
              </div>
              <div className="p-4 text-center">
                <p className="line-clamp-2 text-sm font-semibold text-gray-50">{profile.currentRole}</p>
                <p className="mt-1 text-xs text-gray-500">Current role</p>
              </div>
              <div className="p-4 text-center">
                <p className="line-clamp-2 text-sm font-semibold text-gray-50">{profile.industries[0]}</p>
                <p className="mt-1 text-xs text-gray-500">Industry experience</p>
              </div>
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

          <Card>
            <CardHeader>
              <CardTitle>TailoredIQ contribution</CardTitle>
              <CardDescription>Experience contributed to the TailoredIQ knowledge network.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 divide-x divide-gray-800 p-0">
              <div className="p-4 text-center">
                {advisoryCount === null ? (
                  <Skeleton className="mx-auto h-6 w-8" />
                ) : (
                  <p className="text-lg font-semibold text-gray-50">{advisoryCount}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Advisory conversations</p>
              </div>
              <div className="p-4 text-center">
                {contributionCount === null ? (
                  <Skeleton className="mx-auto h-6 w-8" />
                ) : (
                  <p className="text-lg font-semibold text-gray-50">{contributionCount}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Knowledge contributions</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-lg font-semibold text-gray-50">{profile.totalProjects}</p>
                <p className="mt-1 text-xs text-gray-500">Projects supported</p>
              </div>
            </CardContent>
          </Card>

          {reviews && reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Reviews</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {reviews.slice(0, 3).map(({ review, reviewer }) => (
                  <div key={review.id} className="flex gap-3 border-b border-gray-900 pb-5 last:border-0 last:pb-0">
                    <Avatar firstName={reviewer.firstName} lastName={reviewer.lastName} src={reviewer.avatarUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-gray-200">
                          {reviewer.firstName} {reviewer.lastName}
                        </p>
                        <span className="shrink-0 text-xs text-gray-500">{formatRelative(review.createdAt)}</span>
                      </div>
                      <span className="mt-0.5 flex items-center gap-0.5 text-primary-400">
                        {Array.from({ length: 5 }).map((_, i) =>
                          i < review.rating ? (
                            <StarFilled key={i} className="size-3" aria-hidden />
                          ) : (
                            <Star key={i} className="size-3 text-gray-700" aria-hidden />
                          ),
                        )}
                      </span>
                      <p className="mt-1.5 text-sm leading-relaxed text-gray-300">{review.comment}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4 md:sticky md:top-6 md:self-start">
          <Card className="p-4">
            <p className="text-2xl font-semibold text-gray-50">
              {formatCurrency(profile.consultationRate)}
              <span className="text-sm font-normal text-gray-500"> / session</span>
            </p>
            <p className="mt-1 text-xs text-gray-400">{profile.yearsExperience} years of experience</p>

            {hasAvailability ? (
              <>
                <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-gray-500">Pick a time</p>
                <div className="flex flex-col gap-1.5">
                  {profile.availabilitySlots.slice(0, 3).map((slot) => (
                    <Link
                      key={slot}
                      href={bookHref}
                      className="rounded-md border border-gray-800 px-3 py-2 text-xs text-gray-300 hover:border-gray-700 hover:bg-gray-900"
                    >
                      {formatCallWhen(slot)}
                    </Link>
                  ))}
                </div>
                <Button asChild className="mt-4 w-full justify-center gap-1.5">
                  <Link href={bookHref}>
                    <Calendar className="size-4" aria-hidden />
                    Book a consultation
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm font-medium text-gray-300">Currently unavailable</p>
                <p className="mt-1 text-xs text-gray-500">Check back soon, or explore other experts in the meantime.</p>
                <Button asChild variant="outline" className="mt-4 w-full justify-center gap-1.5">
                  <Link href="/experts">Explore other experts</Link>
                </Button>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
