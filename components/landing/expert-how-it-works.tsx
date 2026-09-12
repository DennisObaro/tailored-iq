"use client";

import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { useInViewOnce } from "@/hooks/use-in-view-once";
import { SectionLabel } from "@/components/landing/section-label";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * "How it works" for the expert recruitment page.
 *
 * Deliberately the one section on this page built as a ruled grid rather than
 * centred prose or rounded cards: the four steps are a real sequence, so they
 * are set as numbered columns inside a hairline frame, read left to right the
 * way an expert actually moves through the network. The closing cell is the
 * step after step four, which is why the CTA sits inside the same frame
 * rather than in a panel of its own.
 *
 * The section stays entirely greyscale — no gold anywhere — so the one
 * gesture that carries it is the light rule along the top of the step row,
 * which draws once from 01 to 04 as the section scrolls into view with each
 * column's copy rising just behind it.
 */
const STEPS = [
  {
    number: "01",
    title: "Get matched",
    body: "Find challenges aligned with your experience.",
  },
  {
    number: "02",
    title: "Add your perspective",
    body: "Strengthen playbooks or advise clients directly.",
  },
  {
    number: "03",
    title: "Help make it happen",
    body: "Support clients from decision to implementation.",
  },
  {
    number: "04",
    title: "Grow your impact",
    body: "Build your reputation and contribute to a growing network of expertise.",
  },
] as const;

export function ExpertHowItWorks() {
  const { ref, inView } = useInViewOnce<HTMLDivElement>({ threshold: 0.25 });
  const reduced = useReducedMotion();
  // Reduced motion gets the finished state, not a different one: the rule is
  // simply already drawn and the copy already in place.
  const drawn = inView || reduced;

  return (
    <section id="how-it-works" className="border-y border-mkt-hairline">
      {/* Header cell — left-aligned, right half left empty so the frame reads
          as a grid rather than as a banner. */}
      <div className="container-tight border-x border-mkt-hairline py-14 md:py-20">
        <SectionLabel>How it works</SectionLabel>
        <h2 className="mt-5 max-w-2xl text-balance text-[34px] font-semibold leading-[1.15] tracking-normal text-mkt-text md:text-[48px]">
          From your experience to their decision
        </h2>
      </div>

      <div className="border-t border-mkt-hairline">
        <div
          ref={ref}
          className="container-tight relative border-x border-mkt-hairline"
        >
          {/* The one accent: a light rule tracing 01 -> 04 along the hairline
              above the row. */}
          <span
            aria-hidden
            className="absolute -top-px left-0 right-0 h-px origin-left bg-mkt-text-mute transition-transform duration-[1400ms] ease-out"
            style={{ transform: `scaleX(${drawn ? 1 : 0})` }}
          />
          <ol className="grid divide-y divide-mkt-hairline lg:grid-cols-4 lg:divide-x lg:divide-y-0">
            {STEPS.map((step, i) => (
              <li
                key={step.number}
                className="py-10 transition-colors duration-200 hover:bg-mkt-panel lg:px-7 lg:first:pl-0 lg:last:pr-0"
              >
                <div
                  className="transition-[opacity,transform] duration-700 ease-out"
                  style={{
                    opacity: drawn ? 1 : 0,
                    transform: drawn ? "none" : "translateY(12px)",
                    transitionDelay: reduced ? "0ms" : `${200 + i * 180}ms`,
                  }}
                >
                  <span className="block text-sm font-semibold tabular-nums tracking-[0.22em] text-mkt-text-mute">
                    {step.number}
                  </span>
                  <h3 className="mt-5 text-[22px] font-semibold leading-[1.25] tracking-normal text-mkt-text md:text-[26px]">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-[34ch] text-[17px] leading-[1.5] text-mkt-text-soft [text-wrap:pretty]">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="border-t border-mkt-hairline">
        <div className="container-tight flex flex-col gap-6 border-x border-mkt-hairline py-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[19px] leading-[1.4] text-mkt-text md:text-[22px]">
            Ready to put your experience to work?
          </p>
          <Link
            href="/become-an-expert"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-mkt-text-mute/50 px-5 py-3 text-base font-semibold text-mkt-text transition-colors hover:border-mkt-text-mute hover:bg-mkt-panel sm:self-auto"
          >
            Become an expert <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
