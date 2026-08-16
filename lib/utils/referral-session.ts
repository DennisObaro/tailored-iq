const KEY = "tiq_pending_referral";

/**
 * Carries a verified referral code across the sign-up hop
 * (/become-an-expert -> /sign-up -> /expert/onboarding). Session-scoped on
 * purpose: it's a hint about what the user was doing, never the
 * authorisation itself — the code is re-validated and claimed server-side
 * before any expert profile is created.
 */
export function setPendingReferralCode(code: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, code);
}

export function getPendingReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(KEY);
}

export function clearPendingReferralCode() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
}
