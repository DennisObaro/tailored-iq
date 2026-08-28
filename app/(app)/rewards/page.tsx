"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Copy, Check } from "@/components/icons";
import type { CreditTransaction } from "@/lib/types";
import * as referralsApi from "@/lib/api/client-referrals";
import * as creditsApi from "@/lib/api/credits";
import { useSessionStore } from "@/lib/store/use-session-store";
import { CREDIT_SOURCE_LABELS, REFERRAL_CREDIT_AMOUNT } from "@/lib/constants/credits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPoints, formatRelative } from "@/lib/utils/format";

export default function ClientRewardsPage() {
  const user = useSessionStore((s) => s.user);

  const [summary, setSummary] = useState<referralsApi.ClientReferralSummary | null | undefined>(undefined);
  const [ledger, setLedger] = useState<CreditTransaction[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      referralsApi.getClientReferralSummary(user.id),
      creditsApi.listCreditTransactions(user.id),
    ]).then(([s, l]) => {
      if (cancelled) return;
      setSummary(s);
      setLedger(l);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function copyLink() {
    if (!summary) return;
    /**
     * The absolute URL is only knowable in the browser, so it's built here
     * rather than in the API — which has no business knowing what host it's
     * being served from.
     */
    await navigator.clipboard.writeText(`${window.location.origin}${summary.shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (summary === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-50">Points &amp; referrals</h1>
        <p className="mt-1 text-sm text-gray-400">
          Invite someone facing a challenge of their own. When they start it, your points come off the price of your
          next playbook.
        </p>
      </div>

      {summary && (
        <>
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Available points</p>
                <p className="mt-1.5 text-2xl font-semibold text-gray-50">{formatPoints(summary.balance)}</p>
                <p className="mt-0.5 text-sm text-gray-400">
                  {summary.balance > 0
                    ? "Applied automatically the next time you unlock a playbook."
                    : `Worth ${formatPoints(REFERRAL_CREDIT_AMOUNT)} each time an invite starts their first challenge.`}
                </p>
              </div>
              <Award className="size-8 text-gold" aria-hidden />
            </div>

            {summary.balance > 0 && (
              <Button asChild size="sm" variant="outline" className="mt-4 self-start">
                <Link href="/playbooks">Browse playbooks</Link>
              </Button>
            )}
          </Card>

          <section>
            <h2 className="mb-3 text-sm font-medium text-gray-300">Your invite code</h2>
            <Card>
              <CardHeader>
                <CardTitle>Share TailoredIQ</CardTitle>
                <p className="text-xs text-gray-500">
                  You earn {formatPoints(REFERRAL_CREDIT_AMOUNT)} when someone you invited confirms their first
                  brief — not when they sign up.
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                <code className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 font-mono text-sm tracking-wider text-gray-100">
                  {summary.code}
                </code>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={copyLink}>
                  {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                  {copied ? "Link copied" : "Copy invite link"}
                </Button>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium text-gray-300">People you&apos;ve invited</h2>
            {summary.referrals.length === 0 ? (
              <EmptyState
                title="No invites yet"
                description="Share your code with someone working through a challenge of their own."
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col gap-3 pt-4">
                  {summary.referrals.map(({ referral, referredName }) => (
                    <div key={referral.id} className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm text-gray-100">{referredName}</p>
                        <p className="text-xs text-gray-500">
                          {referral.status === "activated"
                            ? `Started their first challenge ${formatRelative(referral.activatedAt ?? referral.createdAt)}`
                            : `Signed up ${formatRelative(referral.createdAt)} — points land when they start a challenge`}
                        </p>
                      </div>
                      <StatusBadge status={referral.status} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium text-gray-300">Points history</h2>
            {ledger.length === 0 ? (
              <Card className="p-4">
                <p className="text-sm text-gray-400">Nothing yet — your first activated invite starts the count.</p>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col gap-3 pt-4">
                  {ledger.map((t) => (
                    <div key={t.id} className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm text-gray-100">{CREDIT_SOURCE_LABELS[t.source]}</p>
                        <p className="text-xs text-gray-500">
                          {t.note} · {formatRelative(t.createdAt)}
                        </p>
                      </div>
                      <span
                        className={
                          t.amount >= 0
                            ? "shrink-0 tabular-nums text-gold"
                            : "shrink-0 tabular-nums text-gray-400"
                        }
                      >
                        {t.amount >= 0 ? "+" : "−"}
                        {formatPoints(Math.abs(t.amount))}
                      </span>
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
