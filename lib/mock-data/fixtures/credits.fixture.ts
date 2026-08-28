import type { ClientReferral, CreditTransaction } from "@/lib/types";
import { REFERRAL_CREDIT_AMOUNT } from "@/lib/constants/credits";
import { DEMO_CLIENT_ID, PAST_CLIENT_1_ID, PAST_CLIENT_2_ID } from "./users.fixture";

/** Matches what the API derives for the demo client from their user id. */
const DEMO_CLIENT_CODE = "AMARA-M2DT";

const ago = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

/**
 * Two invitations from the demo client, in the two states a referral can be
 * in: one whose invitee has started a challenge (paid), and one who has
 * signed up but not yet (owed nothing). Without both, the page reads as if
 * every invite pays immediately.
 */
export const seedClientReferrals: ClientReferral[] = [
  {
    id: "client_referral_1",
    code: DEMO_CLIENT_CODE,
    referrerUserId: DEMO_CLIENT_ID,
    referredUserId: PAST_CLIENT_1_ID,
    status: "activated",
    createdAt: ago(21),
    activatedAt: ago(18),
  },
  {
    id: "client_referral_2",
    code: DEMO_CLIENT_CODE,
    referrerUserId: DEMO_CLIENT_ID,
    referredUserId: PAST_CLIENT_2_ID,
    status: "pending",
    createdAt: ago(4),
  },
];

/**
 * The ledger the seeded referrals imply. Written out rather than replayed
 * through the API so the fixture stays a plain description of state — but it
 * must agree with the referrals above, since the balance is their sum.
 */
export const seedCreditTransactions: CreditTransaction[] = [
  {
    id: "credit_1",
    userId: DEMO_CLIENT_ID,
    amount: REFERRAL_CREDIT_AMOUNT,
    source: "referral_activated",
    note: "Michael Torres started their first challenge",
    createdAt: ago(18),
  },
];
