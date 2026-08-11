"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Compass, Briefcase, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RoleSelectCard } from "@/components/onboarding/role-select-card";
import { useSessionStore } from "@/lib/store/use-session-store";
import type { Role } from "@/lib/types";

type RoleChoice = "client" | "expert" | "both";

const ROLE_MAP: Record<RoleChoice, Role[]> = {
  client: ["client"],
  expert: ["expert"],
  both: ["client", "expert"],
};

export default function SignUpPage() {
  const router = useRouter();
  const signUp = useSessionStore((s) => s.signUp);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleChoice, setRoleChoice] = useState<RoleChoice>("client");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!firstName || !lastName || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (!agreed) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }
    setSubmitting(true);
    try {
      await signUp({ firstName, lastName, email, password, roles: ROLE_MAP[roleChoice] });
      router.push("/onboarding/profile");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold text-gray-50">Get answers grounded in real experience.</h1>
        <p className="text-sm text-gray-400">
          Bring a challenge. Find the insight and expertise to move it forward.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </div>

        <div className="flex flex-col gap-2">
          <Label>What brings you to TailoredIQ?</Label>
          <div className="flex flex-col gap-2">
            <RoleSelectCard
              icon={Compass}
              title="Get help with my challenges"
              description="Diagnose a business problem and find relevant experience."
              selected={roleChoice === "client"}
              onSelect={() => setRoleChoice("client")}
            />
            <RoleSelectCard
              icon={Briefcase}
              title="Contribute my expertise"
              description="Advise leaders and share your real-world experience."
              selected={roleChoice === "expert"}
              onSelect={() => setRoleChoice("expert")}
            />
            <RoleSelectCard
              icon={Layers}
              title="Both"
              description="Get help with your own challenges and contribute expertise."
              selected={roleChoice === "both"}
              onSelect={() => setRoleChoice("both")}
            />
          </div>
        </div>

        <label className="flex items-start gap-2 text-xs text-gray-400">
          <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
          I agree to the Terms of Service and Privacy Policy.
        </label>

        <FieldError>{error}</FieldError>

        <Button type="submit" size="lg" loading={submitting} className="w-full justify-center">
          Create account
        </Button>

        <Button type="button" variant="outline" size="lg" className="w-full justify-center" disabled>
          Continue with Google
        </Button>
      </form>

      <p className="text-center text-sm text-gray-400">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-primary-400 hover:text-primary-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
