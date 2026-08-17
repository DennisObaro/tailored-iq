"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "@/components/icons";
import { LogoMark } from "@/components/icons/nav-icons";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { TestimonialCarousel } from "@/components/auth/testimonial-carousel";
import { DotGridBackground } from "@/components/auth/dot-grid-background";
import { useSessionStore } from "@/lib/store/use-session-store";
import * as referralsApi from "@/lib/api/expert-referrals";
import * as expertOnboardingApi from "@/lib/api/expert-onboarding";
import { clearPendingReferralCode, getPendingReferralCode } from "@/lib/utils/referral-session";
import { cn } from "@/lib/utils/cn";

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  agreed?: string;
}

function validateRequired(value: string, label: string) {
  return value.trim() ? undefined : `${label} is required.`;
}

function validateEmail(value: string) {
  if (!value.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
  return undefined;
}

function validatePassword(value: string) {
  if (!value) return "Password is required.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) return "Password must include a letter and a number.";
  return undefined;
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signUp = useSessionStore((s) => s.signUp);
  const refresh = useSessionStore((s) => s.refresh);

  /**
   * Set only when arriving from the verified referral gate. It decides
   * which account gets created — an expert signup still creates one
   * ordinary account, just with the expert role attached and the referral
   * bound to it.
   */
  const referralCode = searchParams.get("referral") ?? getPendingReferralCode();
  const isExpertSignUp = !!referralCode;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const isComplete =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    !validateEmail(email) &&
    !validatePassword(password) &&
    agreed;

  function onBlurField(field: keyof FormErrors) {
    setErrors((prev) => {
      const next = { ...prev };
      if (field === "firstName") next.firstName = validateRequired(firstName, "First name");
      if (field === "lastName") next.lastName = validateRequired(lastName, "Last name");
      if (field === "email") next.email = validateEmail(email);
      if (field === "password") next.password = validatePassword(password);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const nextErrors: FormErrors = {
      firstName: validateRequired(firstName, "First name"),
      lastName: validateRequired(lastName, "Last name"),
      email: validateEmail(email),
      password: validatePassword(password),
      agreed: agreed ? undefined : "You must accept the Terms of Service and Privacy Policy.",
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      const user = await signUp({
        firstName,
        lastName,
        email,
        password,
        roles: isExpertSignUp ? ["expert"] : ["client"],
      });

      if (isExpertSignUp && referralCode) {
        await referralsApi.claimReferralCode(referralCode, user.id, user.email);
        await expertOnboardingApi.startExpertOnboarding(user.id, referralCode);
        clearPendingReferralCode();
        /**
         * startExpertOnboarding flips onboardingComplete/activeRole on the
         * stored user; without re-reading it the session still holds the
         * just-created record, and the app shell bounces an expert into
         * client profile onboarding.
         */
        await refresh();
        router.push("/expert/onboarding");
        return;
      }

      router.push("/onboarding/profile");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-975">
      <div className="flex w-full flex-1 items-center justify-center px-6 py-16 lg:w-1/2">
        <div className="flex w-full max-w-[420px] flex-col items-center">
          <span className="flex size-[68px] shrink-0 items-center justify-center rounded-2xl border border-primary-400 bg-primary-500">
            <LogoMark className="h-9 w-auto text-gray-950" />
          </span>

          <h1 className="mt-[50px] w-full text-xl font-semibold text-gray-50">
            {isExpertSignUp ? "Create your expert account" : "Create your TailoredIQ account"}
          </h1>
          <p className="mt-2.5 w-full text-sm text-gray-400">
            {isExpertSignUp
              ? "Your referral code is verified. This takes a minute — the rest of your profile comes next."
              : "Get strategic guidance grounded in real-world experience."}
          </p>

          <form onSubmit={onSubmit} noValidate className="mt-8 flex w-full flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="firstName" className="sr-only">
                  First name
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => onBlurField("firstName")}
                  autoComplete="given-name"
                  placeholder="First name"
                  error={!!errors.firstName}
                />
                <FieldError>{errors.firstName}</FieldError>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lastName" className="sr-only">
                  Last name
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={() => onBlurField("lastName")}
                  autoComplete="family-name"
                  placeholder="Last name"
                  error={!!errors.lastName}
                />
                <FieldError>{errors.lastName}</FieldError>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="sr-only">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => onBlurField("email")}
                autoComplete="email"
                placeholder="Email address"
                error={!!errors.email}
              />
              <FieldError>{errors.email}</FieldError>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="sr-only">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => onBlurField("password")}
                  autoComplete="new-password"
                  placeholder="Password"
                  error={!!errors.password}
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center text-gray-500 hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-975"
                >
                  {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                </button>
              </div>
              <FieldError>{errors.password}</FieldError>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="mt-1 flex items-start gap-2.5">
                <Checkbox id="terms" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
                <label htmlFor="terms" className="text-sm leading-relaxed text-gray-400">
                  I agree to TailoredIQ&apos;s{" "}
                  <Link href="/terms" className="font-medium text-gray-300 underline underline-offset-2 hover:text-gray-100">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-medium text-gray-300 underline underline-offset-2 hover:text-gray-100">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>
              <FieldError>{errors.agreed}</FieldError>
            </div>

            <FieldError>{formError}</FieldError>

            <Button
              type="submit"
              size="lg"
              loading={submitting}
              className={cn("mt-2.5 w-full justify-center transition-opacity", !isComplete && !submitting && "opacity-50")}
            >
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already a member?{" "}
            <Link href="/sign-in" className="font-medium text-primary-400 hover:text-primary-300">
              Sign in
            </Link>
          </p>

          {!isExpertSignUp && (
            <p className="mt-3 text-center text-sm text-gray-400">
              Invited to join as an expert?{" "}
              <Link href="/become-an-expert" className="font-medium text-primary-400 hover:text-primary-300">
                Enter your referral code
              </Link>
            </p>
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

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-975" />}>
      <SignUpForm />
    </Suspense>
  );
}
