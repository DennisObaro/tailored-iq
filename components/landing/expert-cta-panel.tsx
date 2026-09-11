"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useInViewOnce } from "@/hooks/use-in-view-once";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSessionStore } from "@/lib/store/use-session-store";

/**
 * Closing CTA for the expert recruitment page: the ask on the left, the thing
 * being asked for on the right.
 *
 * The card stack is the point. Three experts sit in a stack and one is lifted
 * out of it, then the lift moves down the stack every few seconds — that is
 * matching, drawn rather than described, and it is the only thing on the page
 * that moves on its own. Reduced motion holds the middle card raised instead.
 *
 * These three mirror seeded expert profiles (lib/mock-data/fixtures/users) so
 * the marketing page shows the same people a visitor meets in the product,
 * but they're written out here rather than imported: `components/` never
 * reaches into `lib/mock-data`, and this is marketing copy either way.
 */
const FEATURED_EXPERTS = [
  {
    name: "Marcus Webb",
    expertise: "Talent & Leadership Development",
    years: 18,
    photo: "/experts/marcus-webb.jpg",
  },
  {
    name: "Priya Raman",
    expertise: "Operations & Supply Chain",
    years: 21,
    photo: "/experts/priya-raman.jpg",
  },
  {
    name: "Daniel Okoye",
    expertise: "Finance & Capital Raising",
    years: 16,
    photo: "/experts/daniel-okoye.jpg",
  },
] as const;

const ROTATION_MS = 3200;

export function ExpertCtaPanel() {
  const { ref, inView } = useInViewOnce<HTMLDivElement>({ threshold: 0.3 });
  const reduced = useReducedMotion();
  const hydrated = useHydrated();
  const user = useSessionStore((s) => s.user);
  const signedIn = hydrated && !!user;

  // Starts on the middle card, so the stack reads the same before the
  // rotation begins as it does with motion turned off entirely.
  const [raised, setRaised] = useState(1);
  useEffect(() => {
    if (!inView || reduced) return;
    const id = setInterval(() => setRaised((i) => (i + 1) % FEATURED_EXPERTS.length), ROTATION_MS);
    return () => clearInterval(id);
  }, [inView, reduced]);

  return (
    <section className="container-tight py-24 md:py-28">
      <div className="card-panel overflow-hidden rounded-[28px] px-7 py-12 md:px-14 md:py-16">
        <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
          <div>
            <h2 className="text-[32px] font-semibold leading-[1.15] tracking-normal text-mkt-text md:text-[40px]">
              Your experience is someone else&rsquo;s shortcut.
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-mkt-text-soft">
              Apply to join as an expert and share what you have learned through advisory
              conversations, contributed documents, and case studies.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href={
                  signedIn
                    ? user.activeRole === "expert"
                      ? "/expert/dashboard"
                      : "/dashboard"
                    : "/become-an-expert"
                }
                className="inline-flex items-center rounded-full bg-mkt-cta px-5 py-3 text-base font-semibold text-mkt-cta-ink transition hover:bg-mkt-cta/90"
              >
                {signedIn ? "Go to dashboard" : "Apply as an expert"}
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center rounded-full border border-mkt-text-mute/50 px-5 py-3 text-base font-semibold text-mkt-text transition-colors hover:border-mkt-text-mute hover:bg-mkt-panel"
              >
                Learn more
              </Link>
            </div>
          </div>

          {/* Card stack: three experts inside one quiet container, with the
              matched one lifted clear of it — wider than the container on
              both sides, brighter, and carrying the only shadow here. */}
          <div ref={ref} className="relative">
            <div
              aria-hidden
              className="dot-grid-bg pointer-events-none absolute -inset-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
            />
            <div className="relative rounded-[22px] border border-mkt-hairline/60 bg-mkt-card/35 p-3">
              <ul className="flex flex-col gap-1">
                {FEATURED_EXPERTS.map((expert, i) => {
                  const isRaised = i === raised;
                  return (
                    <li
                      key={expert.name}
                      className={`relative flex items-center gap-4 rounded-2xl border transition-all duration-500 ease-out ${
                        isRaised
                          ? "z-10 -mx-4 border-mkt-hairline bg-mkt-card px-5 py-4 shadow-[0_26px_55px_-26px_rgba(0,0,0,0.5)] sm:-mx-6"
                          : "border-transparent px-3 py-3 opacity-55"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={expert.photo}
                        alt=""
                        className="size-11 shrink-0 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div
                          className={`truncate text-[15px] font-semibold transition-colors duration-500 ${
                            isRaised ? "text-mkt-text" : "text-mkt-text-soft"
                          }`}
                        >
                          {expert.name}
                        </div>
                        <div className="truncate text-[13px] text-mkt-text-mute">
                          {expert.expertise}
                        </div>
                      </div>
                      <div
                        className={`shrink-0 text-[15px] tabular-nums transition-colors duration-500 ${
                          isRaised ? "font-semibold text-mkt-text" : "text-mkt-text-mute"
                        }`}
                      >
                        {expert.years} yrs
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
