"use client";

import { ExpertCtaPanel } from "@/components/landing/expert-cta-panel";
import { ExpertEngagements } from "@/components/landing/expert-engagements";
import { ExpertHowItWorks } from "@/components/landing/expert-how-it-works";
import { ExpertNetworkRow } from "@/components/landing/expert-network-row";
import { ExpertPromise } from "@/components/landing/expert-promise";
import { MarketingLanding } from "@/components/landing/marketing-landing";

/**
 * The "for experts" recruitment landing page. The shell supplies the nav,
 * hero, quote, founder note, logo marquee and footer; everything specific to
 * recruiting an expert is passed in as sections, in the order they are read.
 */
export function ExpertsLanding() {
  return (
    <MarketingLanding
      hero={{
        title: "Put your Experience Capital to work.",
        subtitle:
          "Your hard-won experience can help leaders navigate the challenges you've already faced. Share your expertise, shape better decisions, and make an impact beyond your own organisation.",
        ctaLabel: "Become an expert",
      }}
      sections={
        <>
          <ExpertHowItWorks />
          <ExpertEngagements />
          <ExpertNetworkRow />
          <ExpertPromise />
        </>
      }
      bottomCta={<ExpertCtaPanel />}
    />
  );
}
