"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import * as api from "@/lib/api/expert-onboarding";
import { EXPERT_POLICIES, EXPERT_POLICY_VERSION } from "@/lib/constants/expert";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { StepShell, type StepProps } from "./step-shell";

export function PoliciesStep({ profile, onSaved, onBack }: StepProps) {
  const [accepted, setAccepted] = useState<string[]>(
    profile.policiesAccepted && profile.policyVersionAccepted === EXPERT_POLICY_VERSION
      ? EXPERT_POLICIES.map((p) => p.id)
      : [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(policyId: string) {
    setAccepted((prev) => (prev.includes(policyId) ? prev.filter((p) => p !== policyId) : [...prev, policyId]));
  }

  const all = accepted.length === EXPERT_POLICIES.length;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      onSaved(await api.acceptPolicies(profile.userId, accepted));
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't record that just now.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <StepShell
      title="Expert policies"
      blurb="These requirements protect you, our clients and the integrity of the network. Read each one and accept it."
      onNext={save}
      onBack={onBack}
      saving={saving}
      error={error}
      nextDisabled={!all}
      nextLabel="Accept and continue"
      footerNote={!all ? `${accepted.length} of ${EXPERT_POLICIES.length} accepted` : `Version ${EXPERT_POLICY_VERSION}`}
    >
      <Card className="border-primary-500/30 bg-primary-500/5 p-4">
        <p className="flex items-start gap-2.5 text-sm text-gray-200">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary-400" aria-hidden />
          A knowledge check follows — it asks how these apply in situations you&apos;ll actually meet, not whether you read
          them.
        </p>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-1 p-2">
          {EXPERT_POLICIES.map((policy) => (
            <label
              key={policy.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-900"
            >
              <Checkbox
                className="mt-0.5"
                checked={accepted.includes(policy.id)}
                onChange={() => toggle(policy.id)}
                aria-label={`Accept: ${policy.title}`}
              />
              <span>
                <span className="block text-sm font-medium text-gray-100">{policy.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-gray-400">{policy.body}</span>
              </span>
            </label>
          ))}
        </CardContent>
      </Card>
    </StepShell>
  );
}
