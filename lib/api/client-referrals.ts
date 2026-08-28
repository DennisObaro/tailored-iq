import type { ClientReferral, User } from "@/lib/types";
import { simulateNetwork, ApiError } from "./client";
import { db, type Database } from "./_db";
import { id } from "@/lib/utils/id";
import { REFERRAL_CREDIT_AMOUNT } from "@/lib/constants/credits";
import { balanceWithin, recordCreditWithin } from "./credits";

/* --------------------------------------------------------------- the code */

/**
 * A client's invite code is derived from their account rather than stored.
 *
 * Unlike an expert referral — a single-use row the platform mints, hands out
 * and can revoke — this is an open, evergreen invitation belonging to the
 * person, so there is exactly one per client for the life of the account and
 * nothing to keep in sync. A real backend would persist it on the user; the
 * point here is that the code and the account can never disagree.
 *
 * Ambiguous characters (0/O, 1/I) are left out of the suffix because people
 * read these codes aloud and type them from memory.
 */
const SUFFIX_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function suffixFor(userId: string): string {
  let hash = 0;
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += SUFFIX_ALPHABET[hash % SUFFIX_ALPHABET.length];
    hash = Math.floor(hash / SUFFIX_ALPHABET.length) + 7;
  }
  return out;
}

function codeFor(user: User): string {
  const name = user.firstName.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 8) || "TIQ";
  return `${name}-${suffixFor(user.id)}`;
}

function normalise(code: string): string {
  return code.trim().toUpperCase();
}

function findReferrerByCode(d: Database, code: string): User | undefined {
  const wanted = normalise(code);
  return d.users.find((u) => codeFor(u) === wanted);
}

/* ------------------------------------------------------------- validation */

export interface ClientReferralValidation {
  valid: boolean;
  referrerName?: string;
  message?: string;
}

/** Read-only: checking a code never consumes or binds it. */
export async function validateClientReferralCode(code: string): Promise<ClientReferralValidation> {
  return simulateNetwork(
    () => {
      const referrer = findReferrerByCode(db.get(), code);
      if (!referrer) return { valid: false, message: "We don't recognise that invite code." };
      return { valid: true, referrerName: `${referrer.firstName} ${referrer.lastName}` };
    },
    { latency: [150, 300] },
  );
}

/**
 * Binds a new client to the person who invited them.
 *
 * The referral is created `pending`: nothing is paid out here, because
 * signing up is not the thing being rewarded. It's also the only moment a
 * referral can be attached — a client who arrives without a code can't
 * retro-fit one later by asking a friend for theirs.
 */
export async function claimClientReferralCode(
  code: string,
  userId: string,
  email?: string,
): Promise<ClientReferral> {
  return simulateNetwork(() =>
    db.update((d) => {
      const referrer = findReferrerByCode(d, code);
      if (!referrer) throw new ApiError("We don't recognise that invite code.", "NOT_FOUND");
      if (referrer.id === userId) {
        throw new ApiError("You can't invite yourself.", "SELF_REFERRAL");
      }
      if (d.clientReferrals.some((r) => r.referredUserId === userId)) {
        throw new ApiError("This account already came in through an invite.", "ALREADY_REFERRED");
      }

      const referral: ClientReferral = {
        id: id("client_referral"),
        code: normalise(code),
        referrerUserId: referrer.id,
        referredUserId: userId,
        referredEmail: email,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      d.clientReferrals.push(referral);
      return referral;
    }),
  );
}

/* ------------------------------------------------------------- activation */

/**
 * The moment a referral counts, called from the brief pipeline.
 *
 * Confirming a brief is the first thing a client does that means they're
 * actually here, which is why it — and not signing up — releases the credit.
 * The status flip is what makes this idempotent: every later brief finds an
 * activated referral and pays nothing.
 */
export function activateClientReferralWithin(d: Database, referredUserId: string): void {
  const referral = d.clientReferrals.find(
    (r) => r.referredUserId === referredUserId && r.status === "pending",
  );
  if (!referral) return;

  const now = new Date().toISOString();
  referral.status = "activated";
  referral.activatedAt = now;

  const referred = d.users.find((u) => u.id === referredUserId);
  const referredName = referred ? `${referred.firstName} ${referred.lastName}` : "someone you invited";
  recordCreditWithin(d, {
    userId: referral.referrerUserId,
    amount: REFERRAL_CREDIT_AMOUNT,
    source: "referral_activated",
    note: `${referredName} started their first challenge`,
  });

  d.notifications.unshift({
    id: id("notif"),
    userId: referral.referrerUserId,
    type: "credit_earned",
    title: "You've earned referral points",
    body: `${referredName} started their first challenge on TailoredIQ. Your points are ready to use on any playbook.`,
    linkHref: "/rewards",
    read: false,
    createdAt: now,
  });
}

/* ---------------------------------------------------------------- reading */

export interface ReferralListing {
  referral: ClientReferral;
  /** Named rather than joined in the page — the caller shouldn't have to fetch users to render a list. */
  referredName: string;
}

export interface ClientReferralSummary {
  code: string;
  /** Ready to paste into a message; the invited client lands on sign-up with the code filled in. */
  shareUrl: string;
  balance: number;
  referrals: ReferralListing[];
  activatedCount: number;
}

export async function getClientReferralSummary(userId: string): Promise<ClientReferralSummary | null> {
  return simulateNetwork(
    () => {
      const d = db.get();
      const user = d.users.find((u) => u.id === userId);
      if (!user) return null;

      const code = codeFor(user);
      const referrals = d.clientReferrals
        .filter((r) => r.referrerUserId === userId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .map((referral) => {
          const referred = d.users.find((u) => u.id === referral.referredUserId);
          return {
            referral,
            referredName: referred
              ? `${referred.firstName} ${referred.lastName}`
              : (referral.referredEmail ?? "An invited client"),
          };
        });

      return {
        code,
        shareUrl: `/sign-up?invite=${encodeURIComponent(code)}`,
        balance: balanceWithin(d, userId),
        referrals,
        activatedCount: referrals.filter((r) => r.referral.status === "activated").length,
      };
    },
    { latency: [150, 300] },
  );
}
