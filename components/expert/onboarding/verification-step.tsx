"use client";

import { useState } from "react";
import { ShieldCheck, FileText, Link2, Briefcase, UserCheck } from "@/components/icons";
import * as api from "@/lib/api/expert-onboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StepShell, type StepProps } from "./step-shell";

export function VerificationStep({ profile, onSaved, onBack }: StepProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checks = [
    {
      icon: FileText,
      label: "Professional evidence",
      detail: `${profile.evidence.length} item${profile.evidence.length === 1 ? "" : "s"} on file`,
      done: profile.evidence.length > 0,
    },
    {
      icon: Link2,
      label: "Public professional presence",
      detail: profile.linkedinUrl ?? profile.websiteUrl ?? "No public link added",
      done: !!(profile.linkedinUrl || profile.websiteUrl),
    },
    {
      icon: Briefcase,
      label: "Employment history",
      detail: profile.organisation ? `${profile.currentRole} · ${profile.organisation}` : "Not provided",
      done: !!profile.organisation,
    },
    {
      icon: UserCheck,
      label: "Expertise claims",
      detail: `${profile.expertise.length} area${profile.expertise.length === 1 ? "" : "s"}, ${
        profile.expertise.filter((e) => e.evidenceStatus === "supported").length
      } evidenced from your CV`,
      done: profile.expertise.length > 0,
    },
  ];

  async function next() {
    setSaving(true);
    setError(null);
    try {
      onSaved(await api.acknowledgeVerification(profile.userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't continue just now.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <StepShell
      title="Verification"
      blurb="Before your profile goes live, a reviewer checks that the experience you've described is real and matches the evidence you've given us."
      onNext={next}
      onBack={onBack}
      saving={saving}
      error={error}
      nextLabel="Looks right — continue"
    >
      <Card>
        <CardHeader>
          <CardTitle>What we&apos;ll check</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {checks.map((check) => (
            <div key={check.label} className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-2.5">
                <check.icon className="mt-0.5 size-4 shrink-0 text-gray-500" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm text-gray-100">{check.label}</p>
                  <p className="truncate text-xs text-gray-500">{check.detail}</p>
                </div>
              </div>
              <Badge variant={check.done ? "success" : "outline"}>{check.done ? "Provided" : "Optional"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-primary-500/30 bg-primary-500/5 p-4">
        <p className="flex items-start gap-2.5 text-sm text-gray-200">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
          Verification is what makes an expert recommendation worth acting on. Until it&apos;s complete you won&apos;t appear
          to clients, and you won&apos;t be able to join client calls.
        </p>
      </Card>
    </StepShell>
  );
}
