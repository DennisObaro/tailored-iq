"use client";

import { MarketingLanding } from "@/components/landing/marketing-landing";
import { CATEGORIES } from "@/lib/constants/categories";

/**
 * The "for experts" recruitment landing page, ported from the landing-page
 * project's routes/experts.tsx. All of its content is configuration passed to
 * the shared MarketingLanding shell.
 *
 * The one substantive change is the priorities list. The source imported its
 * own 7-item EXPERT_CATEGORIES taxonomy; this uses this app's own CATEGORIES
 * (lib/constants/categories.ts), which is what expert matching actually runs
 * on. Advertising a taxonomy the product doesn't implement would mean an
 * applicant reading "Finance, Capital & Risk" here and then meeting
 * "Finance & Capital" the moment they signed up — and would have meant a
 * second, conflicting category list living in the codebase.
 */
export function ExpertsLanding() {
  return (
    <MarketingLanding
      hero={{
        eyebrow: "Inaugural network · Now accepting expert applications",
        title: "Put your Experience Capital to work.",
        subtitle:
          "Your hard-won experience can help leaders navigate the challenges you've already faced. Share your expertise, shape better decisions, and make an impact beyond your own organisation.",
        ctaLabel: "Become an expert",
      }}
      prioritiesEyebrow="What you can contribute on"
      prioritiesTitle="Your experience, where it matters most"
      prioritiesIntro="Users come to the network with real decisions on the line, across every business function. The categories below are where the network needs your perspective most."
      priorities={CATEGORIES}
      whyEmphasis="experts"
      bottomCta={{
        heading: "Your experience is someone else's shortcut.",
        body: "Apply to join as an expert and share what you have learned through advisory conversations, contributed documents, and case studies.",
        primaryLabel: "Apply as an Expert",
        secondaryLabel: "Learn more",
      }}
    />
  );
}
