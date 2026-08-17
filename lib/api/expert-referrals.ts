import type { ExpertReferral } from "@/lib/types";
import { simulateNetwork, ApiError } from "./client";
import { db } from "./_db";
import { id } from "@/lib/utils/id";

export interface ReferralValidation {
  valid: boolean;
  referral?: ExpertReferral;
  /** Machine-readable reason, so the UI can vary the copy per failure. */
  code?: "NOT_FOUND" | "EXPIRED" | "ALREADY_USED" | "REVOKED";
  message?: string;
}

function normalize(code: string) {
  return code.trim().toUpperCase();
}

/**
 * A code string identifies one referral, except for an evergreen code —
 * every single-use referral minted from it carries the same code string.
 * So a lookup prefers the record bound to the asking user, then the
 * evergreen master, and only then whatever matched.
 */
function findByCode(referrals: ExpertReferral[], code: string, userId?: string): ExpertReferral | undefined {
  const wanted = normalize(code);
  const matches = referrals.filter((r) => r.code === wanted);
  return (
    (userId ? matches.find((r) => r.referredUserId === userId) : undefined) ??
    matches.find((r) => r.reusable) ??
    matches[0]
  );
}

/**
 * The first gate of the expert flow (spec RULE 1). Read-only — validating a
 * code never consumes it, so a user can check a code, leave, and come back.
 */
export async function validateReferralCode(code: string): Promise<ReferralValidation> {
  return simulateNetwork(
    () => {
      const referral = findByCode(db.get().expertReferrals, code);

      if (!referral) {
        return {
          valid: false,
          code: "NOT_FOUND" as const,
          message: "That referral code couldn't be verified.",
        };
      }
      if (referral.status === "revoked") {
        return {
          valid: false,
          referral,
          code: "REVOKED" as const,
          message: "That referral code has been withdrawn by the person who issued it.",
        };
      }
      if (referral.status === "claimed" || referral.status === "activated" || referral.referredUserId) {
        return {
          valid: false,
          referral,
          code: "ALREADY_USED" as const,
          message: "That referral code has already been used to create an expert account.",
        };
      }
      if (referral.expiresAt && new Date(referral.expiresAt) < new Date()) {
        return {
          valid: false,
          referral,
          code: "EXPIRED" as const,
          message: "That referral code has expired.",
        };
      }

      return { valid: true, referral };
    },
    { latency: [500, 900] },
  );
}

/**
 * Binds a validated code to the user who is becoming an expert. Re-claiming
 * the same code as the same user is a no-op, so a refresh mid-onboarding
 * doesn't lock someone out of their own referral.
 */
export async function claimReferralCode(code: string, userId: string, email?: string): Promise<ExpertReferral> {
  return simulateNetwork(() =>
    db.update((d) => {
      const referral = findByCode(d.expertReferrals, code, userId);
      if (!referral) throw new ApiError("That referral code couldn't be verified.", "NOT_FOUND");
      if (referral.status === "revoked") throw new ApiError("That referral code has been withdrawn.", "REVOKED");

      /**
       * An evergreen code is never consumed: claiming it mints an ordinary
       * single-use referral bound to this user, which is what everything
       * downstream (onboarding, activation, crediting) then works against.
       */
      if (referral.reusable) {
        const now = new Date().toISOString();
        const minted: ExpertReferral = {
          id: id("referral"),
          code: referral.code,
          referrerUserId: referral.referrerUserId,
          referrerName: referral.referrerName,
          referredUserId: userId,
          referredEmail: email,
          status: "claimed",
          createdAt: now,
          claimedAt: now,
        };
        d.expertReferrals.push(minted);
        return minted;
      }

      if (referral.referredUserId && referral.referredUserId !== userId) {
        throw new ApiError("That referral code has already been used.", "ALREADY_USED");
      }
      if (referral.expiresAt && new Date(referral.expiresAt) < new Date() && !referral.referredUserId) {
        throw new ApiError("That referral code has expired.", "EXPIRED");
      }

      referral.referredUserId = userId;
      if (email) referral.referredEmail = email;
      if (referral.status === "unused") {
        referral.status = "claimed";
        referral.claimedAt = new Date().toISOString();
      }
      return referral;
    }),
  );
}

/** The referral an expert account was created against, if any. */
export async function getReferralForUser(userId: string): Promise<ExpertReferral | null> {
  return simulateNetwork(() => db.get().expertReferrals.find((r) => r.referredUserId === userId) ?? null, {
    latency: [80, 180],
  });
}

export interface ReferralListing {
  referral: ExpertReferral;
  referredName?: string;
}

/** Codes this expert has issued — the "refer another expert" surface. */
export async function listReferralsByUser(userId: string): Promise<ReferralListing[]> {
  return simulateNetwork(
    () => {
      const database = db.get();
      const now = new Date();
      return database.expertReferrals
        .filter((r) => r.referrerUserId === userId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .map((stored) => {
          /**
           * Expiry is a function of time, not a stored transition — an
           * unused code past its date reads as expired without anything
           * having had to run to change it.
           */
          const referral =
            stored.status === "unused" && stored.expiresAt && new Date(stored.expiresAt) < now
              ? { ...stored, status: "expired" as const }
              : stored;
          return referral;
        })
        .map((referral) => {
          const referred = referral.referredUserId
            ? database.users.find((u) => u.id === referral.referredUserId)
            : undefined;
          return {
            referral,
            referredName: referred ? `${referred.firstName} ${referred.lastName}` : undefined,
          };
        });
    },
    { latency: [150, 300] },
  );
}

function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 8; i++) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `EMP-${suffix}`;
}

/** Issues a new invitation code on behalf of an expert (spec §21: refer other experts). */
export async function createReferral(referrerUserId: string, referredEmail?: string): Promise<ExpertReferral> {
  return simulateNetwork(() =>
    db.update((d) => {
      const referrer = d.users.find((u) => u.id === referrerUserId);
      if (!referrer) throw new ApiError("User not found.", "NOT_FOUND");

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3);

      const referral: ExpertReferral = {
        id: id("referral"),
        code: generateCode(),
        referrerUserId,
        referrerName: `${referrer.firstName} ${referrer.lastName}`,
        referredEmail,
        status: "unused",
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      };
      d.expertReferrals.push(referral);
      return referral;
    }),
  );
}

export async function revokeReferral(referralId: string): Promise<ExpertReferral> {
  return simulateNetwork(() =>
    db.update((d) => {
      const referral = d.expertReferrals.find((r) => r.id === referralId);
      if (!referral) throw new ApiError("Referral not found.", "NOT_FOUND");
      if (referral.status !== "unused") {
        throw new ApiError("Only an unused code can be withdrawn.", "INVALID_STATE");
      }
      referral.status = "revoked";
      return referral;
    }),
  );
}
