"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowRight } from "@/components/icons";
import { Reveal } from "@/components/landing/reveal";
import { SectionLabel } from "@/components/landing/section-label";
import { useHydrated } from "@/hooks/use-hydrated";

/**
 * "Experience already at work in the network" — three expert portraits for the
 * expert recruitment page, so an applicant can see the company they would be
 * keeping.
 *
 * Portraits ship in two sets, the same people shot against a near-black and a
 * warm off-white backdrop, and swap on `resolvedTheme` exactly the way the
 * home page's hero carousel does (see client-landing-page.tsx): a dark-backdrop
 * portrait on the light theme's off-white page reads as a cutout hole rather
 * than a photograph.
 *
 * NOTE: names and roles below are placeholders standing in for real network
 * members, paired to the right portrait but invented — swap them for real
 * profiles before this page goes anywhere near production. Six more portrait
 * pairs sit unused in public/landing/network for when the real three are
 * chosen.
 */
const NETWORK = [
  {
    photo: 1,
    name: "Emeka Nwosu",
    role: "Former Group COO, industrial manufacturing",
    tags: ["Operations", "Strategy"],
  },
  {
    photo: 2,
    name: "Adaeze Okonkwo",
    role: "Chief People Officer, financial technology",
    tags: ["People & Culture", "Talent"],
  },
  {
    photo: 3,
    name: "Funmilayo Adeyemi",
    role: "Former CFO, reinsurance",
    tags: ["Finance & Capital", "Governance"],
  },
] as const;

export function ExpertNetworkRow() {
  const hydrated = useHydrated();
  // Unknown until mount, so this renders the dark set on the server and swaps
  // once hydrated — never before, or first paint wouldn't match the markup.
  const { resolvedTheme } = useTheme();
  const suffix = hydrated && resolvedTheme === "light" ? "-light" : "";

  return (
    <section className="container-tight py-24 md:py-32">
      {/* The label sits above both columns; the heading and the claim it makes
          start on the same line as each other. */}
      <Reveal>
        <SectionLabel>The network</SectionLabel>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <div>
            <h2 className="text-balance text-[34px] font-semibold leading-[1.2] tracking-normal md:text-[48px]">
              Experience already at work in the network
            </h2>
            <Link
              href="/become-an-expert"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-mkt-text-mute/50 px-5 py-3 text-base font-semibold text-mkt-text transition-colors hover:border-mkt-text-mute hover:bg-mkt-panel"
            >
              Add your experience <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Operators, founders and functional leaders who have run the decisions clients are facing
            now. Every one of them is personally vetted before a single match is made.
          </p>
        </div>
      </Reveal>

      <ul className="mt-16 grid gap-6 sm:grid-cols-3">
        {NETWORK.map((person, i) => (
          <Reveal key={person.name} delay={i * 60} y={16}>
            <li>
              <div className="overflow-hidden rounded-2xl bg-mkt-panel">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/landing/network/expert-${person.photo}${suffix}.jpg`}
                  alt={person.name}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover object-top"
                />
              </div>
              <h3 className="mt-5 text-[18px] font-semibold leading-[1.3] tracking-normal text-mkt-text">
                {person.name}
              </h3>
              <p className="mt-1.5 text-[14px] leading-[1.45] text-mkt-text-mute">{person.role}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {person.tags.map((tag) => (
                  <span key={tag} className="chip px-2.5 py-1 text-xs text-mkt-text-soft">
                    {tag}
                  </span>
                ))}
              </div>
            </li>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
