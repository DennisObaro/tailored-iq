"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { useSessionStore } from "@/lib/store/use-session-store";
import * as usersApi from "@/lib/api/users";
import { INDUSTRIES, FUNCTIONS, SENIORITIES } from "@/lib/constants/categories";

export default function OnboardingProfilePage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const refresh = useSessionStore((s) => s.refresh);
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [func, setFunc] = useState(FUNCTIONS[0]);
  const [seniority, setSeniority] = useState(SENIORITIES[0]);
  const [occupation, setOccupation] = useState("");
  const [interests, setInterests] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      if (user.roles.includes("client")) {
        await usersApi.upsertClientProfile({
          userId: user.id,
          industry,
          occupation,
          function: func,
          seniority,
          interests: interests
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        });
      }
      await usersApi.completeOnboarding(user.id);
      await refresh();
      router.push(user.activeRole === "expert" ? "/expert/dashboard" : "/dashboard");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold text-gray-50">Tell us about your work</h1>
        <p className="text-sm text-gray-400">
          This helps us understand your context and match you to relevant experience.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="industry">Industry</Label>
          <Select id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)}>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="function">Function</Label>
          <Select id="function" value={func} onChange={(e) => setFunc(e.target.value)}>
            {FUNCTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="seniority">Seniority</Label>
          <Select id="seniority" value={seniority} onChange={(e) => setSeniority(e.target.value)}>
            {SENIORITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="occupation">Role / title</Label>
          <Input id="occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="e.g. VP of Operations" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="interests">Areas of responsibility</Label>
          <Input
            id="interests"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="e.g. Leadership development, hiring"
          />
        </div>

        <Button type="submit" size="lg" loading={submitting} className="mt-2 w-full justify-center">
          Continue
        </Button>
      </form>
    </div>
  );
}
