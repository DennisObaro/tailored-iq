"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, StarFilled } from "@/components/icons";
import type { ExpertContribution, ExpertProfile } from "@/lib/types";
import * as expertApi from "@/lib/api/expert-onboarding";
import * as consultationsApi from "@/lib/api/consultations";
import * as contributionsApi from "@/lib/api/contributions";
import * as referralsApi from "@/lib/api/expert-referrals";
import { useSessionStore } from "@/lib/store/use-session-store";
import { CONTRIBUTION_PREFERENCES, helpAreaLabel, levelLabel } from "@/lib/constants/expert";
import { ExpertProfilePreview } from "@/components/expert/expert-profile-preview";
import { ExpertAccessBanner } from "@/components/expert/expert-gate";
import { OnboardingProgress } from "@/components/expert/onboarding-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils/format";

/**
 * The expert's own profile: what clients see, plus the trust signals that
 * make it credible — real reviews, real contributions, real standing —
 * rather than a ratings badge on a freelancer listing.
 */
export default function ExpertProfilePage() {
  const user = useSessionStore((s) => s.user);
  const [reload, setReload] = useState(0);
  const refresh = useSessionStore((s) => s.refresh);

  const [profile, setProfile] = useState<ExpertProfile | null | undefined>(undefined);
  const [reviews, setReviews] = useState<consultationsApi.ReviewListing[]>([]);
  const [contributions, setContributions] = useState<ExpertContribution[]>([]);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [savingAvailability, setSavingAvailability] = useState(false);

  async function load() {
    if (!user) return;
    const [p, reviewList, contributionList, referral] = await Promise.all([
      expertApi.getExpertProfile(user.id),
      consultationsApi.listReviewsForExpert(user.id),
      contributionsApi.listContributionsByExpert(user.id),
      referralsApi.getReferralForUser(user.id),
    ]);
    setProfile(p);
    setReviews(reviewList);
    setContributions(contributionList.filter((c) => c.status === "published"));
    setReferrerName(referral?.referrerName ?? null);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, reload]);

  async function toggleOnline(isOnline: boolean) {
    if (!user) return;
    setSavingAvailability(true);
    try {
      setProfile(await expertApi.updateExpertProfile(user.id, { isOnline }));
      await refresh();
      setReload((n) => n + 1);
    } finally {
      setSavingAvailability(false);
    }
  }

  if (profile === undefined || !user) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6 pt-16 text-center">
        <h1 className="text-xl font-semibold text-gray-50">You don&apos;t have an expert profile yet</h1>
        <p className="text-sm text-gray-400">TailoredIQ experts join by invitation from an existing expert.</p>
        <Button asChild>
          <Link href="/become-an-expert">Enter a referral code</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={profile.verificationStatus} />
            <Badge variant="primary">{levelLabel(profile.expertLevel)}</Badge>
            {referrerName && <Badge variant="outline">Referred by {referrerName}</Badge>}
          </div>
          <h1 className="mt-2 text-xl font-semibold text-gray-50">Your expert profile</h1>
          <p className="mt-1 text-sm text-gray-400">
            {profile.approvedAt
              ? `Approved ${formatDate(profile.approvedAt)}`
              : "Not yet approved — clients can't see this."}
          </p>
        </div>
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <Link href="/expert/onboarding">
            <Pencil className="size-4" aria-hidden />
            Edit profile
          </Link>
        </Button>
      </div>

      <ExpertAccessBanner profile={profile} />

      {profile.verificationStatus === "approved" && (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <label className="flex items-center gap-2.5 text-sm text-gray-200">
            <Checkbox
              checked={profile.isOnline}
              disabled={savingAvailability}
              onChange={(e) => toggleOnline(e.target.checked)}
            />
            Show me as available right now
          </label>
          <span className="text-xs text-gray-500">Clients see this on your listing.</span>
        </Card>
      )}

      {profile.verificationStatus !== "approved" && (
        <Card className="p-4">
          <p className="mb-3 text-sm font-medium text-gray-100">Onboarding progress</p>
          <OnboardingProgress profile={profile} />
        </Card>
      )}

      <div>
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-gray-300">
          <Eye className="size-4" aria-hidden />
          How clients see you
        </h2>
        <ExpertProfilePreview user={user} profile={profile} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your lived experience</CardTitle>
          <p className="text-xs text-gray-500">
            The strongest signal for a client isn&apos;t a rating — it&apos;s whether you&apos;ve actually done this before.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Problems you&apos;ve solved</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.helpAreas.map((id) => (
                <Badge key={id} variant="outline">
                  {helpAreaLabel(id)}
                </Badge>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500">Client projects</p>
              <p className="mt-0.5 text-lg font-semibold text-gray-50">{profile.totalProjects}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Published contributions</p>
              <p className="mt-0.5 text-lg font-semibold text-gray-50">{contributions.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Contribution points</p>
              <p className="mt-0.5 text-lg font-semibold text-gray-50">{profile.points}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">You contribute by</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CONTRIBUTION_PREFERENCES.filter((p) => profile.contributionPreferences.includes(p.key)).map((p) => (
                <Badge key={p.key}>{p.label}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Client feedback</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400">No client feedback yet.</p>
          ) : (
            reviews.slice(0, 5).map(({ review, reviewer }) => (
              <div key={review.id} className="rounded-lg border border-gray-800 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Avatar firstName={reviewer.firstName} lastName={reviewer.lastName} size="sm" />
                  <span className="text-sm text-gray-200">
                    {reviewer.firstName} {reviewer.lastName}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-primary-400">
                    <StarFilled className="size-3.5 text-primary-400" aria-hidden />
                    {review.rating}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                </div>
                {review.comment && <p className="mt-2 text-sm text-gray-300">{review.comment}</p>}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
