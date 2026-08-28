/**
 * Client-side referral points.
 *
 * Deliberately separate from the expert referral machinery in ./expert.ts.
 * An expert referral is a gate — a code that decides whether someone may
 * become an expert at all — and pays the referrer in points that are
 * standing: they drive an expert level and are never spent. This is the
 * opposite: an open invitation any client can share, paying a balance in
 * points that are redeemable, coming directly off the price of a playbook
 * (see spendCreditsWithin in lib/api/credits.ts). The two never share a code
 * space, a ledger, or a reward.
 */

/**
 * A referral is `pending` from the moment the invited client signs up, and
 * only `activated` once they confirm their first brief. Signing up is not
 * the thing being rewarded — bringing someone who actually uses TailoredIQ
 * is, the same reason an expert referral only counts on approval.
 */
export type ClientReferralStatus = "pending" | "activated";

export interface ClientReferral {
  id: string;
  /** The referrer's shareable code, recorded as typed so the row explains itself. */
  code: string;
  referrerUserId: string;
  referredUserId: string;
  referredEmail?: string;
  status: ClientReferralStatus;
  createdAt: string;
  activatedAt?: string;
}

/** What moved the balance. Earnings are positive, spends negative. */
export type CreditSource = "referral_activated" | "playbook_unlock";

/**
 * One line of the client's points ledger, in whole points.
 *
 * The balance is never stored — it's the sum of these rows, so a balance
 * can't drift from the history that produced it. (The expert points ledger
 * keeps the same invariant; it caches a total on the profile only because
 * the expert level is derived from it.)
 */
export interface CreditTransaction {
  id: string;
  userId: string;
  /** Signed points: +25000 for an activated referral, -25000 applied to an unlock. */
  amount: number;
  source: CreditSource;
  note: string;
  createdAt: string;
}
