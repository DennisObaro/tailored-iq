"use client";

import { useState } from "react";
import * as api from "@/lib/api/expert-onboarding";
import { INDUSTRIES, FUNCTIONS, SENIORITIES } from "@/lib/constants/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { StepShell, ChipToggle, type StepProps } from "./step-shell";

const MARKETS = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "Egypt",
  "United Kingdom", "Germany", "France", "Poland", "Italy",
  "United Arab Emirates", "India", "Singapore", "United States", "Canada", "Brazil", "Australia",
];

export function BackgroundStep({ profile, onSaved, onBack }: StepProps) {
  const [headline, setHeadline] = useState(profile.headline);
  const [currentRole, setCurrentRole] = useState(profile.currentRole);
  const [organisation, setOrganisation] = useState(profile.organisation);
  const [bio, setBio] = useState(profile.bio);
  const [industries, setIndustries] = useState(profile.industries);
  const [functions, setFunctions] = useState(profile.functions);
  const [markets, setMarkets] = useState(profile.markets);
  const [yearsExperience, setYearsExperience] = useState(profile.yearsExperience || 10);
  const [seniority, setSeniority] = useState(profile.seniority || SENIORITIES[1]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const complete =
    headline.trim() && currentRole.trim() && organisation.trim() && bio.trim().length > 40 &&
    industries.length > 0 && functions.length > 0 && markets.length > 0;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.saveBackground(profile.userId, {
        headline: headline.trim(),
        currentRole: currentRole.trim(),
        organisation: organisation.trim(),
        bio: bio.trim(),
        industries,
        functions,
        markets,
        yearsExperience,
        seniority,
      });
      onSaved(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't save that just now. Nothing has been lost — try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <StepShell
      title="Your professional background"
      blurb="Where you've worked, at what level, and in which markets. This is what client matching runs against."
      onNext={save}
      onBack={onBack}
      saving={saving}
      error={error}
      nextDisabled={!complete}
      footerNote={!complete ? "Fill in every field to continue." : undefined}
    >
      <Card>
        <CardHeader>
          <CardTitle>Role</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Talent & Leadership Development Advisor"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currentRole">Current / most recent role</Label>
              <Input id="currentRole" value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} placeholder="e.g. Chief People Officer" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="organisation">Organisation</Label>
              <Input id="organisation" value={organisation} onChange={(e) => setOrganisation(e.target.value)} placeholder="e.g. Northwind Software" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="years">Years of experience</Label>
              <Input
                id="years"
                type="number"
                min={0}
                max={60}
                value={yearsExperience}
                onChange={(e) => setYearsExperience(Number(e.target.value))}
              />
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
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bio">Professional background</Label>
            <Textarea
              id="bio"
              rows={5}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What you've actually done: the scale you operated at, the problems you owned, and the outcomes you're known for."
            />
            <p className="text-xs text-gray-500">{bio.trim().length} characters — aim for a short paragraph.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Industries</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          {INDUSTRIES.map((i) => (
            <ChipToggle key={i} selected={industries.includes(i)} onToggle={() => toggle(industries, setIndustries, i)}>
              {i}
            </ChipToggle>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Functions</CardTitle>
          <p className="text-xs text-gray-500">The parts of a business you&apos;ve run — separate from the industry you ran them in.</p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          {FUNCTIONS.map((f) => (
            <ChipToggle key={f} selected={functions.includes(f)} onToggle={() => toggle(functions, setFunctions, f)}>
              {f}
            </ChipToggle>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Markets you&apos;ve worked in</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          {MARKETS.map((m) => (
            <ChipToggle key={m} selected={markets.includes(m)} onToggle={() => toggle(markets, setMarkets, m)}>
              {m}
            </ChipToggle>
          ))}
        </CardContent>
      </Card>
    </StepShell>
  );
}
