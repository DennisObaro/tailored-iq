"use client";

import { useState } from "react";
import type { ExpertContributionPreference, ExpertWillingness } from "@/lib/types";
import * as api from "@/lib/api/expert-onboarding";
import { CONTRIBUTION_PREFERENCES, PREFERENCE_TO_WILLINGNESS, WILLINGNESS_LABELS } from "@/lib/constants/expert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StepShell, OptionCard, type StepProps } from "./step-shell";

const ALL_WILLINGNESS: ExpertWillingness[] = [
  "review",
  "contribute_insight",
  "advisory_call",
  "playbook_contribution",
  "consulting_engagement",
];

export function ContributionsStep({ profile, onSaved, onBack }: StepProps) {
  const [selected, setSelected] = useState<ExpertContributionPreference[]>(profile.contributionPreferences);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(key: ExpertContributionPreference) {
    setSelected((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  }

  /**
   * Preferences are the expert-facing question ("how do you want to
   * contribute?"); willingness is what an opportunity actually offers.
   * Deriving one from the other keeps them from drifting apart.
   */
  const derivedWillingness = ALL_WILLINGNESS.filter((w) =>
    selected.some((pref) => PREFERENCE_TO_WILLINGNESS[pref].includes(w)),
  );

  async function save() {
    setSaving(true);
    setError(null);
    try {
      onSaved(await api.saveContributionPreferences(profile.userId, selected, derivedWillingness));
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't save that just now.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <StepShell
      title="How do you want to contribute?"
      blurb="Pick everything you're open to. This decides which opportunities reach you — you can change it any time."
      onNext={save}
      onBack={onBack}
      saving={saving}
      error={error}
      nextDisabled={selected.length === 0}
      footerNote={selected.length === 0 ? "Pick at least one." : undefined}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {CONTRIBUTION_PREFERENCES.map((pref) => (
          <OptionCard
            key={pref.key}
            selected={selected.includes(pref.key)}
            onToggle={() => toggle(pref.key)}
            title={pref.label}
            description={pref.description}
          />
        ))}
      </div>

      {derivedWillingness.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>What you&apos;ll be offered</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1 text-sm text-gray-300">
              {derivedWillingness.map((w) => (
                <li key={w} className="flex gap-2">
                  <span className="text-gold" aria-hidden>
                    &middot;
                  </span>
                  {WILLINGNESS_LABELS[w]}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </StepShell>
  );
}
