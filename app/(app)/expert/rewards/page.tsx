"use client";

import { useEffect, useState } from "react";
import { Award, Copy, Check, UserPlus } from "lucide-react";
import type { ExpertPointsTransaction } from "@/lib/types";
import * as pointsApi from "@/lib/api/expert-points";
import * as referralsApi from "@/lib/api/expert-referrals";
import { useSessionStore } from "@/lib/store/use-session-store";
import { EXPERT_LEVELS, POINT_SOURCE_LABELS, POINT_VALUES } from "@/lib/constants/expert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export default function ExpertRewardsPage() {
  const user = useSessionStore((s) => s.user);
  const [reload, setReload] = useState(0);
  const refetch = () => setReload((n) => n + 1);
  const [standing, setStanding] = useState<pointsApi.ExpertStanding | null | undefined>(undefined);
  const [ledger, setLedger] = useState<ExpertPointsTransaction[]>([]);
  const [referrals, setReferrals] = useState<referralsApi.ReferralListing[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    const [s, l, r] = await Promise.all([
      pointsApi.getExpertStanding(user.id),
      pointsApi.listPointsTransactions(user.id),
      referralsApi.listReferralsByUser(user.id),
    ]);
    setStanding(s);
    setLedger(l);
    setReferrals(r);
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

  async function issueCode() {
    if (!user) return;
    setIssuing(true);
    try {
      await referralsApi.createReferral(user.id, inviteEmail.trim() || undefined);
      setInviteEmail("");
      refetch();
    } finally {
      setIssuing(false);
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  if (standing === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-50">Rewards &amp; standing</h1>
        <p className="mt-1 text-sm text-gray-400">
          Standing is earned through what you contribute — client work, published knowledge, and reviewing others&apos;.
        </p>
      </div>

      {standing && (
        <>
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge variant="primary">{standing.level.label}</Badge>
                <p className="mt-2 text-2xl font-semibold text-gray-50">{standing.points} points</p>
                <p className="mt-0.5 text-sm text-gray-400">{standing.level.blurb}</p>
              </div>
              <Award className="size-8 text-primary-400" aria-hidden />
            </div>

            {standing.next && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{standing.level.label}</span>
                  <span>
                    {standing.pointsToNext} points to {standing.next.label}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-850">
                  <div
                    className="h-full rounded-full bg-primary-500 transition-[width]"
                    style={{ width: `${Math.min(100, Math.max(2, standing.progress * 100))}%` }}
                  />
                </div>
              </div>
            )}
          </Card>

          <section>
            <h2 className="mb-3 text-sm font-medium text-gray-300">Levels</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {EXPERT_LEVELS.map((level) => {
                const reached = standing.points >= level.minPoints;
                return (
                  <Card
                    key={level.key}
                    className={cn("p-4", level.key === standing.level.key && "border-primary-500 bg-primary-500/5")}
                  >
                    <div className="flex items-center justify-between">
                      <p className={cn("text-sm font-medium", reached ? "text-gray-50" : "text-gray-400")}>
                        {level.label}
                      </p>
                      <Badge variant={reached ? "success" : "outline"}>{level.minPoints}+ pts</Badge>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{level.blurb}</p>
                  </Card>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium text-gray-300">Where your points came from</h2>
            {standing.breakdown.length === 0 ? (
              <Card className="p-4">
                <p className="text-sm text-gray-400">No points yet — your first contribution starts the count.</p>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col gap-2 pt-4">
                  {standing.breakdown.map((row) => (
                    <div key={row.source} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">
                        {POINT_SOURCE_LABELS[row.source]}
                        <span className="ml-1.5 text-xs text-gray-500">×{row.count}</span>
                      </span>
                      <span className="tabular-nums text-gray-100">{row.points}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </section>

          <section id="referrals" className="scroll-mt-6">
            <h2 className="mb-3 text-sm font-medium text-gray-300">Refer an expert</h2>
            <Card>
              <CardHeader>
                <CardTitle>Issue an invitation code</CardTitle>
                <p className="text-xs text-gray-500">
                  Experts join by invitation only. You earn {POINT_VALUES.referral_activated} points when someone you
                  referred is approved — not when they sign up.
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label htmlFor="inviteEmail">Their email (optional)</Label>
                    <Input
                      id="inviteEmail"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="name@company.com"
                    />
                  </div>
                  <Button className="gap-1.5" loading={issuing} onClick={issueCode}>
                    <UserPlus className="size-4" aria-hidden />
                    Issue code
                  </Button>
                </div>

                {referrals.length === 0 ? (
                  <p className="text-sm text-gray-400">You haven&apos;t issued any codes yet.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {referrals.map(({ referral, referredName }) => (
                      <li
                        key={referral.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-800 p-3"
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-sm text-gray-100">{referral.code}</p>
                          <p className="text-xs text-gray-500">
                            {referredName
                              ? `Used by ${referredName}`
                              : referral.referredEmail
                                ? `Sent to ${referral.referredEmail}`
                                : "Not used yet"}
                            {referral.expiresAt && ` · expires ${formatDate(referral.expiresAt)}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={referral.status} />
                          {referral.status === "unused" && (
                            <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => copy(referral.code)}>
                              {copied === referral.code ? (
                                <Check className="size-3.5 text-success-400" aria-hidden />
                              ) : (
                                <Copy className="size-3.5" aria-hidden />
                              )}
                              {copied === referral.code ? "Copied" : "Copy"}
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium text-gray-300">Points history</h2>
            {ledger.length === 0 ? (
              <EmptyState icon={Award} title="No activity yet." description="Every contribution you make is recorded here." />
            ) : (
              <Card>
                <CardContent className="flex flex-col gap-2 pt-4">
                  {ledger.slice(0, 20).map((t) => (
                    <div key={t.id} className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate text-gray-200">{t.note}</p>
                        <p className="text-xs text-gray-500">
                          {POINT_SOURCE_LABELS[t.source]} · {formatRelative(t.createdAt)}
                        </p>
                      </div>
                      <span className="shrink-0 tabular-nums text-primary-400">+{t.points}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  );
}
