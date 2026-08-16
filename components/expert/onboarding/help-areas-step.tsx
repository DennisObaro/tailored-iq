"use client";

import { useState } from "react";
import * as api from "@/lib/api/expert-onboarding";
import { HELP_AREA_GROUPS } from "@/lib/constants/expert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StepShell, ChipToggle, type StepProps } from "./step-shell";

export function HelpAreasStep({ profile, onSaved, onBack }: StepProps) {
  const [selected, setSelected] = useState<string[]>(profile.helpAreas);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(areaId: string) {
    setSelected((prev) => (prev.includes(areaId) ? prev.filter((a) => a !== areaId) : [...prev, areaId]));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      onSaved(await api.saveHelpAreas(profile.userId, selected));
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't save that just now.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <StepShell
      title="What can you help leaders with?"
      blurb="Not what you'd call yourself an expert in — the problems you've actually solved. Clients arrive with a problem, and this is what we match it against."
      onNext={save}
      onBack={onBack}
      saving={saving}
      error={error}
      nextDisabled={selected.length === 0}
      footerNote={selected.length > 0 ? `${selected.length} selected` : "Pick at least one."}
    >
      {HELP_AREA_GROUPS.map((group) => (
        <Card key={group.group}>
          <CardHeader>
            <CardTitle>{group.group}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {group.areas.map((area) => (
              <ChipToggle key={area.id} selected={selected.includes(area.id)} onToggle={() => toggle(area.id)}>
                {area.label}
              </ChipToggle>
            ))}
          </CardContent>
        </Card>
      ))}
    </StepShell>
  );
}
