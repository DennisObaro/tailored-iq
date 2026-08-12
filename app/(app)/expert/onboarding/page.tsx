"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { useSessionStore } from "@/lib/store/use-session-store";
import * as usersApi from "@/lib/api/users";
import type { ExpertProfile, SuggestedExpertise } from "@/lib/types";
import { INDUSTRIES } from "@/lib/constants/categories";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const WILLINGNESS_OPTIONS: { key: ExpertProfile["willingness"][number]; label: string }[] = [
  { key: "review", label: "Review content" },
  { key: "contribute_insight", label: "Contribute an insight" },
  { key: "advisory_call", label: "Advisory calls" },
  { key: "playbook_contribution", label: "Playbook contribution" },
  { key: "consulting_engagement", label: "Longer consulting engagement" },
];

const ETHICS_STATEMENTS = [
  "I will not fabricate expertise, credentials, or project experience.",
  "I will keep client information confidential.",
  "I understand AI-generated content will always be distinguished from my own input.",
];

export default function ExpertOnboardingPage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [existing, setExisting] = useState<ExpertProfile | null>(null);

  const [headline, setHeadline] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState(10);
  const [industries, setIndustries] = useState<string[]>([]);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [willingness, setWillingness] = useState<ExpertProfile["willingness"]>(["advisory_call", "contribute_insight"]);

  const [suggested, setSuggested] = useState<SuggestedExpertise[] | null>(null);
  const [confirmedTags, setConfirmedTags] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const [ethicsChecked, setEthicsChecked] = useState<boolean[]>(ETHICS_STATEMENTS.map(() => false));
  const [policiesAccepted, setPoliciesAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    usersApi.getExpertProfile(user.id).then((p) => {
      setExisting(p);
      if (p) {
        setHeadline(p.headline);
        setCurrentRole(p.currentRole);
        setBio(p.bio);
        setYearsExperience(p.yearsExperience);
        setIndustries(p.industries);
        setLinkedinUrl(p.linkedinUrl ?? "");
        setWillingness(p.willingness);
        setSuggested(p.suggestedExpertise);
        setConfirmedTags(p.expertiseTags);
        setPoliciesAccepted(p.policiesAccepted);
        setEthicsChecked(ETHICS_STATEMENTS.map(() => p.ethicsQuizComplete));
      }
      setLoadingProfile(false);
    });
  }, [user]);

  async function analyze() {
    setAnalyzing(true);
    const result = await usersApi.analyzeExpertise(bio, currentRole, yearsExperience);
    setSuggested(result);
    setConfirmedTags(result.map((r) => r.label));
    setAnalyzing(false);
  }

  function toggleTag(tag: string) {
    setConfirmedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function toggleIndustry(industry: string) {
    setIndustries((prev) => (prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]));
  }

  function toggleWillingness(key: ExpertProfile["willingness"][number]) {
    setWillingness((prev) => (prev.includes(key) ? prev.filter((w) => w !== key) : [...prev, key]));
  }

  const ethicsComplete = ethicsChecked.every(Boolean);
  const canSubmit =
    user && headline && currentRole && bio && industries.length > 0 && confirmedTags.length > 0 && policiesAccepted && ethicsComplete;

  async function submit() {
    if (!user || !canSubmit) return;
    setSubmitting(true);
    const profile: ExpertProfile = {
      userId: user.id,
      headline,
      currentRole,
      bio,
      yearsExperience,
      industries,
      expertiseTags: confirmedTags,
      suggestedExpertise: suggested ?? [],
      seniority: existing?.seniority ?? "Senior Leader",
      expertLevel: existing?.expertLevel ?? "associate",
      verificationStatus: "approved",
      policiesAccepted,
      ethicsQuizComplete: ethicsComplete,
      linkedinUrl: linkedinUrl || undefined,
      rating: existing?.rating ?? 0,
      reviewCount: existing?.reviewCount ?? 0,
      totalProjects: existing?.totalProjects ?? 0,
      consultationRate: existing?.consultationRate ?? 200,
      availabilitySlots: existing?.availabilitySlots ?? [],
      isOnline: existing?.isOnline ?? true,
      willingness,
    };
    await usersApi.upsertExpertProfile(profile);
    if (!user.roles.includes("expert")) {
      await usersApi.addRole(user.id, "expert");
    }
    router.push("/expert/dashboard");
  }

  if (loadingProfile) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-50">
          {existing ? "Your expert profile" : "Complete your expert profile"}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Your experience can help leaders make better decisions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About you</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="headline">Headline</Label>
            <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Talent & Leadership Development Advisor" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currentRole">Current role</Label>
            <Input id="currentRole" value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} placeholder="e.g. Fractional CPO" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bio">Professional background</Label>
            <Textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Summarize your experience, industries, and the kinds of problems you've solved..." />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="years">Years of experience</Label>
            <Input
              id="years"
              type="number"
              min={0}
              value={yearsExperience}
              onChange={(e) => setYearsExperience(Number(e.target.value))}
              className="w-24"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="linkedin">LinkedIn (optional)</Label>
            <Input id="linkedin" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Industries</Label>
            <div className="flex flex-wrap gap-1.5">
              {INDUSTRIES.map((i) => (
                <button type="button" key={i} onClick={() => toggleIndustry(i)}>
                  <Badge variant={industries.includes(i) ? "primary" : "outline"}>{i}</Badge>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Areas of expertise</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!suggested ? (
            <Button variant="outline" onClick={analyze} loading={analyzing} disabled={!bio || !currentRole} className="gap-1.5 self-start">
              <Sparkles className="size-4" aria-hidden />
              Analyze my profile
            </Button>
          ) : (
            <>
              <p className="text-xs text-gray-500">We identified these areas from your experience:</p>
              <div className="flex flex-col gap-2">
                {suggested.map((s) => (
                  <label key={s.label} className="flex items-center justify-between gap-3 rounded-md border border-gray-800 px-3 py-2">
                    <span className="flex items-center gap-2 text-sm text-gray-200">
                      <Checkbox checked={confirmedTags.includes(s.label)} onChange={() => toggleTag(s.label)} />
                      {s.label}
                    </span>
                    <span className="text-xs text-gray-500">{s.confidence}%</span>
                  </label>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={analyze} loading={analyzing} className="self-start">
                Re-analyze
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How you can contribute</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {WILLINGNESS_OPTIONS.map((opt) => (
            <label key={opt.key} className="flex items-center gap-2 text-sm text-gray-300">
              <Checkbox checked={willingness.includes(opt.key)} onChange={() => toggleWillingness(opt.key)} />
              {opt.label}
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Policies & ethics</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {ETHICS_STATEMENTS.map((statement, i) => (
            <label key={statement} className="flex items-start gap-2 text-sm text-gray-300">
              <Checkbox
                className="mt-0.5"
                checked={ethicsChecked[i]}
                onChange={(e) =>
                  setEthicsChecked((prev) => prev.map((v, idx) => (idx === i ? e.target.checked : v)))
                }
              />
              {statement}
            </label>
          ))}
          <label className="mt-2 flex items-start gap-2 border-t border-gray-800 pt-3 text-sm text-gray-300">
            <Checkbox className="mt-0.5" checked={policiesAccepted} onChange={(e) => setPoliciesAccepted(e.target.checked)} />
            I accept the TailoredIQ Expert Policies.
          </label>
        </CardContent>
      </Card>

      <Button size="lg" className="w-full justify-center gap-1.5" disabled={!canSubmit} loading={submitting} onClick={submit}>
        <CheckCircle2 className="size-4" aria-hidden />
        {existing ? "Save profile" : "Complete my profile"}
      </Button>
    </div>
  );
}
