"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "@/components/icons";
import { LogoMark } from "@/components/icons/nav-icons";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { TestimonialCarousel } from "@/components/auth/testimonial-carousel";
import { DotGridBackground } from "@/components/auth/dot-grid-background";
import * as referralsApi from "@/lib/api/expert-referrals";
import * as expertOnboardingApi from "@/lib/api/expert-onboarding";
import { useSessionStore } from "@/lib/store/use-session-store";
import { setPendingReferralCode } from "@/lib/utils/referral-session";
import { cn } from "@/lib/utils/cn";

/**
 * The gate. Nothing in the expert flow exists before a code is verified:
 * expert onboarding refuses to run without a claimed referral, and the
 * expert profile record is only created once one has been claimed — so
 * navigating straight to /expert/onboarding can't get anyone past this.
 */
export default function BecomeAnExpertPage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const refresh = useSessionStore((s) => s.refresh);

  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [verified, setVerified] = useState<{ referrerName: string } | null>(null);
  const [continuing, setContinuing] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      setError("Enter the referral code you were sent.");
      return;
    }
    setChecking(true);
    setError(null);
    setHint(null);
    try {
      const result = await referralsApi.validateReferralCode(code);
      if (!result.valid || !result.referral) {
        setError(result.message ?? "That referral code couldn't be verified.");
        setHint(
          result.code === "EXPIRED"
            ? "Ask the person who invited you to issue a new one."
            : result.code === "ALREADY_USED"
              ? "If this was you, sign in instead — your expert profile is already started."
              : "Check the code and try again, or contact the person who invited you.",
        );
        return;
      }
      setVerified({ referrerName: result.referral.referrerName });
    } catch {
      setError("We couldn't check that code just now.");
      setHint("Your code hasn't been used. Try again in a moment.");
    } finally {
      setChecking(false);
    }
  }

  /**
   * Signed in already → claim the code against this account and go
   * straight to onboarding (a client becoming an expert keeps one
   * account). Otherwise carry the verified code into sign-up.
   */
  async function onContinue() {
    setContinuing(true);
    setError(null);
    try {
      const normalized = code.trim().toUpperCase();
      setPendingReferralCode(normalized);

      if (user) {
        await referralsApi.claimReferralCode(normalized, user.id, user.email);
        await expertOnboardingApi.startExpertOnboarding(user.id, normalized);
        await refresh();
        router.push("/expert/onboarding");
      } else {
        router.push(`/sign-up?referral=${encodeURIComponent(normalized)}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't continue just now.");
      setHint("Nothing has been saved. Try again, or use a different code.");
      setContinuing(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-975">
      <div className="flex w-full flex-1 items-center justify-center px-6 py-16 lg:w-1/2">
        <div className="flex w-full max-w-[420px] flex-col items-center">
          <span className="flex size-[68px] shrink-0 items-center justify-center rounded-2xl border border-primary-400 bg-primary-500">
            <LogoMark className="h-9 w-auto text-gray-950" />
          </span>

          {verified ? (
            <>
              <div className="mt-[50px] flex w-full items-center gap-2">
                <CheckCircle2 className="size-5 text-success-400" aria-hidden />
                <h1 className="text-xl font-semibold text-gray-50">You&apos;re invited.</h1>
              </div>
              <p className="mt-2.5 w-full text-sm text-gray-400">
                Your referral code has been verified{verified.referrerName ? ` — ${verified.referrerName} invited you` : ""}.
                Let&apos;s set up your expert profile.
              </p>

              <div className="mt-8 flex w-full flex-col gap-3">
                <Button size="lg" className="w-full justify-center gap-2" loading={continuing} onClick={onContinue}>
                  {user ? "Set up my expert profile" : "Create my account"}
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setVerified(null);
                    setCode("");
                  }}
                  className="w-full justify-center"
                >
                  Use a different code
                </Button>
                <FieldError>{error}</FieldError>
                {error && hint && <p className="text-xs text-gray-500">{hint}</p>}
              </div>
            </>
          ) : (
            <>
              <h1 className="mt-[50px] w-full text-xl font-semibold text-gray-50">Become a TailoredIQ expert</h1>
              <p className="mt-2.5 w-full text-sm text-gray-400">
                Put your experience to work helping leaders make better decisions.
              </p>

              <form onSubmit={onSubmit} noValidate className="mt-8 flex w-full flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="referral">Enter your referral code</Label>
                  <Input
                    id="referral"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      if (error) setError(null);
                    }}
                    placeholder="EMP-XXXXXXXX"
                    autoComplete="off"
                    spellCheck={false}
                    error={!!error}
                    className="font-mono tracking-wide"
                  />
                  <FieldError>{error}</FieldError>
                  {error && hint ? (
                    <p className="text-xs text-gray-500">{hint}</p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      TailoredIQ experts join by invitation. Your code came from the person who invited you.
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  loading={checking}
                  className={cn("mt-2.5 w-full justify-center transition-opacity", !code.trim() && !checking && "opacity-50")}
                >
                  Continue
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-400">
                Already an expert?{" "}
                <Link href="/sign-in" className="font-medium text-primary-400 hover:text-primary-300">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <div className="relative hidden w-1/2 overflow-hidden bg-gray-975 lg:block">
        <DotGridBackground className="absolute inset-0" />
        <div className="relative z-10 h-full">
          <TestimonialCarousel />
        </div>
      </div>
    </div>
  );
}
