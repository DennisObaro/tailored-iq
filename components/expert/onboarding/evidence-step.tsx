"use client";

import { useRef, useState } from "react";
import { FileText, Link2, Trash2, Upload, Sparkles } from "lucide-react";
import type { ExpertEvidence } from "@/lib/types";
import * as api from "@/lib/api/expert-onboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { StepShell, type StepProps } from "./step-shell";

const LINK_KINDS: { value: ExpertEvidence["kind"]; label: string; placeholder: string }[] = [
  { value: "linkedin", label: "LinkedIn profile", placeholder: "https://linkedin.com/in/..." },
  { value: "website", label: "Professional website", placeholder: "https://..." },
  { value: "link", label: "Other professional link", placeholder: "https://..." },
  { value: "thought_leadership", label: "Thought leadership", placeholder: "https://... (article, talk, paper)" },
];

const KIND_ICONS: Record<ExpertEvidence["kind"], typeof FileText> = {
  cv: FileText,
  linkedin: Link2,
  website: Link2,
  link: Link2,
  thought_leadership: FileText,
};

export function EvidenceStep({ profile, onSaved, onBack }: StepProps) {
  const [evidence, setEvidence] = useState(profile.evidence);
  const [cvText, setCvText] = useState("");
  const [cvName, setCvName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<string[] | null>(null);

  const [linkKind, setLinkKind] = useState<ExpertEvidence["kind"]>("linkedin");
  const [linkValue, setLinkValue] = useState("");
  const [addingLink, setAddingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  /**
   * The prototype has no file storage, so we read the file in the browser
   * and hand its text to the same extraction call a real upload would —
   * which is where the interesting behaviour is anyway.
   */
  async function onFile(file: File) {
    setCvName(file.name);
    setUploadError(null);
    try {
      const text = await file.text();
      setCvText(text);
    } catch {
      setUploadError("We couldn't read that file.");
    }
  }

  async function uploadCv() {
    setUploading(true);
    setUploadError(null);
    setExtracted(null);
    try {
      const result = await api.addEvidence(profile.userId, {
        kind: "cv",
        label: cvName || "CV",
        value: cvName || "cv.txt",
        content: cvText,
      });
      setEvidence(result.profile.evidence);
      setCvText("");
      setCvName("");
      if (fileInput.current) fileInput.current.value = "";

      const parsed = result.parsed;
      setExtracted(
        parsed
          ? [
              parsed.currentRole && `Role: ${parsed.currentRole}`,
              parsed.organisation && `Organisation: ${parsed.organisation}`,
              parsed.yearsExperience && `${parsed.yearsExperience} years' experience`,
              parsed.industries.length > 0 && `Industries: ${parsed.industries.join(", ")}`,
              parsed.functions.length > 0 && `Functions: ${parsed.functions.join(", ")}`,
              parsed.markets.length > 0 && `Markets: ${parsed.markets.join(", ")}`,
            ].filter((x): x is string => !!x)
          : [],
      );
    } catch (e) {
      setUploadError(
        e instanceof Error ? e.message : "We couldn't process that CV.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function addLink() {
    if (!linkValue.trim()) return;
    setAddingLink(true);
    setLinkError(null);
    try {
      const kindLabel = LINK_KINDS.find((k) => k.value === linkKind)?.label ?? "Link";
      const result = await api.addEvidence(profile.userId, {
        kind: linkKind,
        label: kindLabel,
        value: linkValue.trim(),
      });
      setEvidence(result.profile.evidence);
      setLinkValue("");
    } catch (e) {
      setLinkError(e instanceof Error ? e.message : "We couldn't add that link.");
    } finally {
      setAddingLink(false);
    }
  }

  async function remove(evidenceId: string) {
    const updated = await api.removeEvidence(profile.userId, evidenceId);
    setEvidence(updated.evidence);
  }

  async function next() {
    const updated = await api.getExpertProfile(profile.userId);
    if (updated) onSaved(updated);
  }

  return (
    <StepShell
      title="Professional evidence"
      blurb="Upload your CV and we'll pull out what we can, so you don't retype a career we can already read. Everything here is used to verify your experience — it's never shown to clients as-is."
      onNext={next}
      onBack={onBack}
      nextDisabled={evidence.length === 0}
      footerNote={evidence.length === 0 ? "Add at least one piece of evidence." : undefined}
    >
      <Card>
        <CardHeader>
          <CardTitle>CV / resume</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <input
            ref={fileInput}
            type="file"
            accept=".txt,.md,.rtf,.doc,.docx,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileInput.current?.click()}>
              <Upload className="size-4" aria-hidden />
              Choose file
            </Button>
            {cvName && <span className="text-xs text-gray-400">{cvName}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cvText">Or paste your CV</Label>
            <Textarea
              id="cvText"
              rows={5}
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder="Paste the text of your CV — roles, organisations, markets, and what you delivered."
            />
          </div>

          {uploadError && (
            <ErrorState
              whatHappened={uploadError}
              dataSafe="Nothing was saved, and the text above is still here."
              nextStep="Try pasting the text of your CV instead, or add a LinkedIn profile below."
            />
          )}

          {extracted && (
            <div className="rounded-lg border border-primary-500/30 bg-primary-500/5 p-3">
              <p className="flex items-center gap-1.5 text-sm font-medium text-primary-400">
                <Sparkles className="size-4" aria-hidden />
                We read this from your CV
              </p>
              {extracted.length === 0 ? (
                <p className="mt-1.5 text-xs text-gray-400">
                  We stored it as evidence, but couldn&apos;t extract structured details — you can fill those in yourself.
                </p>
              ) : (
                <ul className="mt-1.5 flex flex-col gap-0.5 text-xs text-gray-300">
                  {extracted.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs text-gray-500">Added to your background — you can edit any of it on the previous step.</p>
            </div>
          )}

          <Button size="sm" loading={uploading} disabled={cvText.trim().length < 40} onClick={uploadCv} className="self-start">
            {uploading ? "Reading your CV…" : "Upload and extract"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Professional links</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={linkKind}
              onChange={(e) => setLinkKind(e.target.value as ExpertEvidence["kind"])}
              className="sm:w-56"
              aria-label="Link type"
            >
              {LINK_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </Select>
            <Input
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              placeholder={LINK_KINDS.find((k) => k.value === linkKind)?.placeholder}
              className="flex-1"
              aria-label="Link URL"
            />
            <Button variant="outline" loading={addingLink} onClick={addLink} disabled={!linkValue.trim()}>
              Add
            </Button>
          </div>
          {linkError && <p className="text-xs text-danger-400">{linkError}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Added so far</CardTitle>
        </CardHeader>
        <CardContent>
          {evidence.length === 0 ? (
            <p className="text-sm text-gray-500">Nothing added yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {evidence.map((e) => {
                const Icon = KIND_ICONS[e.kind];
                return (
                  <li key={e.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-800 p-3">
                    <div className="flex min-w-0 gap-2.5">
                      <Icon className="mt-0.5 size-4 shrink-0 text-gray-500" aria-hidden />
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm text-gray-100">
                          {e.label}
                          <Badge variant="outline">{e.kind === "cv" ? "CV" : "Link"}</Badge>
                        </p>
                        <p className="truncate text-xs text-gray-500">{e.value}</p>
                        {e.excerpt && <p className="mt-1 line-clamp-2 text-xs text-gray-400">{e.excerpt}</p>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(e.id)}
                      aria-label={`Remove ${e.label}`}
                      className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-850 hover:text-danger-400"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </StepShell>
  );
}
