"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowRight, ChevronLeft, ChevronRight } from "@/components/icons";
import { Reveal } from "@/components/landing/reveal";
import { SectionLabel } from "@/components/landing/section-label";
import { useHydrated } from "@/hooks/use-hydrated";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * "Experience already in the network" — a scrolling row of expert portraits
 * for the expert recruitment page, so an applicant can see the company they
 * would be keeping.
 *
 * Portraits ship in two sets, the same nine people shot against a near-black
 * and a warm off-white backdrop, and swap on `resolvedTheme` exactly the way
 * the home page's hero carousel does (see client-landing-page.tsx): a
 * dark-backdrop portrait on the light theme's off-white page reads as a
 * cutout hole rather than a photograph.
 *
 * NOTE: names and roles below are placeholders standing in for real network
 * members, paired to the right portrait but invented — swap them for real
 * profiles before this page goes anywhere near production.
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
  {
    photo: 4,
    name: "Samuel Boateng",
    role: "Former Managing Director, West Africa",
    tags: ["Leadership", "Market Expansion"],
  },
  {
    photo: 5,
    name: "Zainab Bello",
    role: "Head of Digital Transformation, retail banking",
    tags: ["Digital & AI", "Operations"],
  },
  {
    photo: 6,
    name: "Tunde Oyelaran",
    role: "Founder & CEO, agritech",
    tags: ["Strategy", "Partnerships"],
  },
  {
    photo: 7,
    name: "Ngozi Eze",
    role: "Director of Talent, pan-African banking",
    tags: ["Talent", "Leadership"],
  },
  {
    photo: 8,
    name: "Kwame Mensah",
    role: "Partner, corporate advisory",
    tags: ["Governance", "Finance & Capital"],
  },
  {
    photo: 9,
    name: "Bayo Adewale",
    role: "Former VP Operations, consumer goods",
    tags: ["Operations", "Market Expansion"],
  },
] as const;

/** Card width + gap, so the arrows advance by exactly one card. */
const STEP = 260 + 20;

export function ExpertNetworkRow() {
  const hydrated = useHydrated();
  const reduced = useReducedMotion();
  // Unknown until mount, so this renders the dark set on the server and swaps
  // once hydrated — never before, or first paint wouldn't match the markup.
  const { resolvedTheme } = useTheme();
  const suffix = hydrated && resolvedTheme === "light" ? "-light" : "";

  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(syncEdges, [syncEdges]);

  const scrollByCard = (direction: 1 | -1) => {
    trackRef.current?.scrollBy({
      left: direction * STEP,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  return (
    <section className="overflow-x-clip py-24 md:py-32">
      <div className="container-tight">
        <Reveal className="flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-2xl">
            <SectionLabel>The network</SectionLabel>
            <h2 className="mt-5 text-balance text-[34px] font-semibold leading-[1.2] tracking-normal md:text-[48px]">
              Experience already at work in the network
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Operators, founders and functional leaders who have run the decisions clients are
              facing now. Every one of them is personally vetted before a single match is made.
            </p>
            <Link
              href="/become-an-expert"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-mkt-text-mute/50 px-5 py-3 text-base font-semibold text-mkt-text transition-colors hover:border-mkt-text-mute hover:bg-mkt-panel"
            >
              Add your experience <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          {/* Controls sit with the heading rather than over the portraits, so
              nothing covers a face. */}
          <div className="flex gap-3">
            {(
              [
                { dir: -1 as const, label: "Previous experts", Icon: ChevronLeft, disabled: atStart },
                { dir: 1 as const, label: "Next experts", Icon: ChevronRight, disabled: atEnd },
              ]
            ).map(({ dir, label, Icon, disabled }) => (
              <button
                key={label}
                type="button"
                onClick={() => scrollByCard(dir)}
                disabled={disabled}
                aria-label={label}
                className="grid size-11 place-items-center rounded-full border border-mkt-hairline text-mkt-text transition-[background-color,border-color,opacity,transform] duration-200 ease-out hover:border-mkt-text-mute/50 hover:bg-mkt-panel active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35"
              >
                <Icon className="size-4" aria-hidden />
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      {/* The row starts at the container's reading edge and runs off the right
          of the viewport, so the network reads as continuing past the frame. */}
      <div className="container-tight mt-12">
        <ul
          ref={trackRef}
          onScroll={syncEdges}
          className="-mr-[calc((100vw-100%)/2)] flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 pr-[calc((100vw-100%)/2)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {NETWORK.map((person, i) => (
            <li key={person.name} className="w-[260px] shrink-0 snap-start">
              {/* Only the cards that land on screen together need staggering;
                  the rest arrive already revealed as you scroll the row. */}
              <Reveal delay={Math.min(i, 4) * 60} y={16}>
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
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
