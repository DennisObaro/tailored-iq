"use client";

import { useEffect, useState } from "react";
import { Sparkles, Plus, X, ShieldAlert, ShieldCheck } from "lucide-react";
import type { ExpertExpertise } from "@/lib/types";
import * as api from "@/lib/api/expert-onboarding";
import { CATEGORIES } from "@/lib/constants/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StepShell, type StepProps } from "./step-shell";

/** Bar behind a confidence score — reads faster than the number alone. */
function ConfidenceBar({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-1 w-16 overflow-hidden rounded-full bg-gray-850">
        <span className="block h-full rounded-full bg-primary-500" style={{ width: `${Math.max(4, value)}%` }} />
      </span>
      <span className="w-9 text-right text-xs tabular-nums text-gray-500">{value}%</span>
    </span>
  );
}

export function ExpertiseStep({ profile, onSaved, onBack }: StepProps) {
  const [expertise, setExpertise] = useState<ExpertExpertise[]>(profile.expertise);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [evidenceFor, setEvidenceFor] = useState<string | null>(null);
  const [evidenceText, setEvidenceText] = useState("");

  // First visit: run the analysis automatically — this is the step's whole point.
  useEffect(() => {
    if (profile.expertise.length === 0) void analyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function analyze() {
    setAnalyzing(true);
    setError(null);
    try {
      setExpertise(await api.analyzeExpertise(profile.userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't analyse your profile just now.");
    } finally {
      setAnalyzing(false);
    }
  }

  function remove(label: string) {
    setExpertise((prev) => prev.filter((e) => e.label !== label));
  }

  /**
   * A manually added area is only accepted if something on file actually
   * supports it (spec §6) — otherwise the expert is asked to point at the
   * experience behind the claim before it can be confirmed.
   */
  async function addManual() {
    const label = newLabel.trim();
    if (!label || expertise.some((e) => e.label.toLowerCase() === label.toLowerCase())) {
      setNewLabel("");
      return;
    }
    setAdding(true);
    try {
      const support = await api.checkExpertiseSupport(profile.userId, label);
      setExpertise((prev) => [
        ...prev,
        {
          label,
          confidence: support.supported ? 70 : 0,
          source: "manual",
          evidenceStatus: support.supported ? "supported" : "needs_evidence",
        },
      ]);
      if (!support.supported) setEvidenceFor(label);
      setNewLabel("");
    } finally {
      setAdding(false);
    }
  }

  function submitEvidence(label: string) {
    if (evidenceText.trim().length < 20) return;
    setExpertise((prev) =>
      prev.map((e) =>
        e.label === label
          ? { ...e, evidenceStatus: "evidence_submitted" as const, supportingEvidence: evidenceText.trim() }
          : e,
      ),
    );
    setEvidenceFor(null);
    setEvidenceText("");
  }

  const unresolved = expertise.filter((e) => e.evidenceStatus === "needs_evidence");

  async function save() {
    setSaving(true);
    setError(null);
    try {
      onSaved(await api.confirmExpertise(profile.userId, expertise));
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't save that just now.");
    } finally {
      setSaving(false);
    }
  }

  const suggestions = CATEGORIES.filter((c) => !expertise.some((e) => e.label === c));

  return (
    <StepShell
      title="Your areas of expertise"
      blurb="These decide which client challenges you're matched to, so they need to reflect experience you can actually evidence."
      onNext={save}
      onBack={onBack}
      saving={saving}
      error={error}
      nextDisabled={expertise.length === 0 || unresolved.length > 0}
      footerNote={
        unresolved.length > 0
          ? `Add supporting experience for ${unresolved.map((e) => e.label).join(", ")}.`
          : expertise.length === 0
            ? "Confirm at least one area."
            : undefined
      }
    >
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>We identified these from your experience</CardTitle>
            <p className="mt-1 text-xs text-gray-500">Based on your background and the evidence you added.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={analyze} loading={analyzing} className="gap-1.5">
            <Sparkles className="size-4" aria-hidden />
            Re-analyse
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {analyzing && expertise.length === 0 ? (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          ) : expertise.length === 0 ? (
            <p className="text-sm text-gray-500">
              Nothing identified yet. Add an area below, or go back and add more detail to your background.
            </p>
          ) : (
            expertise.map((e) => (
              <div key={e.label} className="flex flex-col gap-2 rounded-lg border border-gray-800 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm text-gray-100">
                    {e.evidenceStatus === "needs_evidence" ? (
                      <ShieldAlert className="size-4 text-primary-400" aria-hidden />
                    ) : (
                      <ShieldCheck className="size-4 text-success-400" aria-hidden />
                    )}
                    {e.label}
                    {e.source === "manual" && <Badge variant="outline">Added by you</Badge>}
                    {e.evidenceStatus === "evidence_submitted" && <Badge>Evidence provided</Badge>}
                  </span>
                  <span className="flex items-center gap-3">
                    {e.source === "ai" && <ConfidenceBar value={e.confidence} />}
                    <button
                      type="button"
                      onClick={() => remove(e.label)}
                      aria-label={`Remove ${e.label}`}
                      className="rounded p-1 text-gray-500 hover:bg-gray-900 hover:text-danger-400"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </span>
                </div>

                {e.evidenceStatus === "needs_evidence" && (
                  <div className="flex flex-col gap-2 rounded-md bg-gray-975 p-3">
                    <p className="text-sm font-medium text-gray-100">You added {e.label}.</p>
                    <p className="text-xs text-gray-400">
                      Nothing in your CV or profile mentions it. Point us at the experience that supports it — a role, a
                      programme you owned, an outcome you delivered.
                    </p>
                    {evidenceFor === e.label ? (
                      <>
                        <Textarea
                          rows={3}
                          value={evidenceText}
                          onChange={(ev) => setEvidenceText(ev.target.value)}
                          placeholder="e.g. I owned the HR strategy for a 900-person business through a two-year restructuring, including the operating model redesign."
                          aria-label={`Supporting experience for ${e.label}`}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" disabled={evidenceText.trim().length < 20} onClick={() => submitEvidence(e.label)}>
                            Submit evidence
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEvidenceFor(null)}>
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" className="self-start" onClick={() => setEvidenceFor(e.label)}>
                        Add supporting experience
                      </Button>
                    )}
                  </div>
                )}

                {e.supportingEvidence && (
                  <p className="rounded-md bg-gray-975 p-2 text-xs text-gray-400">{e.supportingEvidence}</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add an area we missed</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="newArea" className="sr-only">
                Area of expertise
              </Label>
              <Input
                id="newArea"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void addManual();
                  }
                }}
                placeholder="e.g. HR Strategy"
              />
            </div>
            <Button variant="outline" className="gap-1.5" loading={adding} onClick={addManual} disabled={!newLabel.trim()}>
              <Plus className="size-4" aria-hidden />
              Add
            </Button>
          </div>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((c) => (
                <button key={c} type="button" onClick={() => setNewLabel(c)}>
                  <Badge variant="outline">{c}</Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </StepShell>
  );
}
