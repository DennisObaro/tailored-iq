"use client";

import { EyeOff, Link2, UserCheck } from "@/components/icons";
import { Reveal } from "@/components/landing/reveal";

/**
 * "Our Promise" — how the network behaves, for the expert recruitment page.
 *
 * Set flat on the page: a left-aligned heading, then three columns each led by
 * a single stroke icon. No cards, no borders, no CTAs — the only thing holding
 * a column together is the column itself, which is what keeps three promises
 * from reading as three offers.
 *
 * Icons come from the app's own hugeicons barrel rather than a new set, and
 * each one says something about its promise: a vetted person, a pairing, and
 * an eye closed — which is the third promise's own words, no public profiles
 * and no marketplace visibility.
 */
const PROMISES = [
  {
    icon: UserCheck,
    title: "Curated, not crowded",
    body: "Every expert is personally vetted. Every match is intentional. We do not scale by lowering the bar.",
  },
  {
    icon: Link2,
    title: "Context-first matching",
    body: "We pair you with operators who have navigated the same decisions in similar markets — not just the same sector.",
  },
  {
    icon: EyeOff,
    title: "Confidential by design",
    body: "Sensitive decisions stay between you and your advisor. No public profiles. No marketplace visibility.",
  },
] as const;

export function ExpertPromise() {
  return (
    <section className="container-tight py-24 md:py-32">
      <Reveal className="max-w-2xl">
        <span className="eyebrow">Our Promise</span>
        <h2 className="mt-4 text-balance text-[34px] font-semibold leading-[1.2] tracking-normal md:text-[48px]">
          How we show up every time
        </h2>
      </Reveal>

      <div className="mt-16 grid gap-12 sm:grid-cols-2 md:gap-x-16 lg:grid-cols-3">
        {PROMISES.map(({ icon: Icon, title, body }, i) => (
          <Reveal key={title} delay={i * 60} y={16}>
            <Icon className="size-8 text-mkt-text" strokeWidth={1.6} aria-hidden />
            <h3 className="mt-6 max-w-[16ch] text-[22px] font-semibold leading-[1.25] tracking-normal text-mkt-text md:text-[24px]">
              {title}
            </h3>
            <p className="mt-3 max-w-[38ch] text-[17px] leading-[1.55] text-mkt-text-soft [text-wrap:pretty]">
              {body}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
