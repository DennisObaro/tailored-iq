import type { CreditSource } from "@/lib/types";

/**
 * Client referral credit configuration, kept here rather than inline so the
 * reward can be re-tuned in one place — the same reason POINT_VALUES lives
 * in ./expert.ts.
 */

/** Points credited to the referrer when a referred client confirms their first brief. */
export const REFERRAL_CREDIT_AMOUNT = 25_000;

export const CREDIT_SOURCE_LABELS: Record<CreditSource, string> = {
  referral_activated: "Referral points",
  playbook_unlock: "Applied to a playbook",
};
