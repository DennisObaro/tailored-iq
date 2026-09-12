"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "@/components/icons";
import { Navigation } from "@/components/landing/navigation";
import { Footer } from "@/components/landing/footer";
import { Reveal } from "@/components/landing/reveal";
import { SectionLabel } from "@/components/landing/section-label";
import { FounderNote } from "@/components/landing/founder-note";
import { useSessionStore } from "@/lib/store/use-session-store";
import { useHydrated } from "@/hooks/use-hydrated";

/**
 * The configurable marketing landing shell, ported from the landing-page
 * project's components/LandingPage.tsx. It is the second of that project's two
 * landing layouts: the home page uses the bespoke ClientLandingPage, while this
 * one is driven entirely by props so a single layout can serve several
 * audience-specific pages (currently just /for-experts).
 *
 * Mechanical changes from the source, as elsewhere in this port: TanStack
 * `<Link to>` -> next/link, bundler asset imports -> public/landing/ URLs,
 * lucide -> this app's Hugeicons set (className, not a numeric `size`), and
 * `useAuth` + a `getMyProfile` server function -> `useSessionStore`, where the
 * active role already lives on the session user.
 */

// Monochrome only — the marquee never reveals a colour logo, so the
// full-colour assets aren't referenced here at all.
const CLIENT_LOGOS = [
  { name: "BAT", mono: "/landing/clients/bat-mono.png" },
  { name: "Arnergy", mono: "/landing/clients/arnergy-mono.png" },
  { name: "ISN", mono: "/landing/clients/isn-mono.png" },
  { name: "Fluna", mono: "/landing/clients/fluna-mono.png" },
  { name: "Curacel", mono: "/landing/clients/curacel-mono.png" },
  { name: "KongaPay", mono: "/landing/clients/kongapay-mono.png" },
  { name: "OnePipe", mono: "/landing/clients/onepipe-mono.png" },
  { name: "ACA", mono: "/landing/clients/aca-mono.png" },
  { name: "Interswitch", mono: "/landing/clients/interswitch-mono.png" },
  { name: "Kendor", mono: "/landing/clients/kendor-mono.png" },
  { name: "FITC", mono: "/landing/clients/fitc-mono.png" },
  { name: "Candor Consulting", mono: "/landing/clients/candor-mono.png" },
  { name: "Continental Reinsurance", mono: "/landing/clients/continental-reinsurance-mono.png" },
  { name: "Oryo", mono: "/landing/clients/oryo-mono.png" },
  { name: "AshLuxury", mono: "/landing/clients/ashluxury-mono.png" },
  { name: "Branch", mono: "/landing/clients/branch-mono.png" },
  { name: "AltSchool", mono: "/landing/clients/altschool-mono.png" },
];

// Illustrative sample exchange for the hero's floating chat card — not a real
// conversation, just a mock-up of what an advisory exchange looks like.
const HERO_SAMPLE_EXCHANGE = [
  {
    label: "A Founders Challenge",
    body: "We need to hire a COO, but we're not sure what the role should actually own.",
  },
  {
    label: "Expert Contributor",
    body: "At this stage, I'd focus the role on building operational discipline and preparing the team to scale...",
  },
];

export interface MarketingLandingHero {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  ctaLabel: string;
}

export interface MarketingLandingBottomCta {
  heading: ReactNode;
  body: string;
  primaryLabel: string;
  secondaryLabel: string;
}

export function MarketingLanding({
  hero,
  prioritiesEyebrow,
  prioritiesTitle,
  prioritiesIntro,
  priorities,
  afterHero,
  afterPriorities,
  bottomCta,
}: {
  hero: MarketingLandingHero;
  prioritiesEyebrow: string;
  prioritiesTitle: ReactNode;
  prioritiesIntro: string;
  priorities: readonly string[];
  /** Section slot rendered between the hero and "what it covers". */
  afterHero?: ReactNode;
  /** Section slot rendered just after "what it covers". */
  afterPriorities?: ReactNode;
  /** Closing CTA section, rendered just above the footer. */
  bottomCta: ReactNode;
}) {
  const hydrated = useHydrated();
  const user = useSessionStore((s) => s.user);
  const signedIn = hydrated && !!user;
  // Signed in, both CTAs go straight into the app; signed out they go to
  // sign-up. The source threaded a `role` search param through to its own
  // /signup route to preselect the audience — this app's sign-up has no such
  // param, so the distinction is dropped rather than faked.
  const primaryHref = signedIn ? (user.activeRole === "expert" ? "/expert/dashboard" : "/dashboard") : "/sign-up";

  return (
    <div className="marketing-shell flex min-h-screen flex-col bg-mkt-page">
      <Navigation />

      {/* HERO — left/right intro (headline / subtitle + CTA) over a full-width
          photo tile carrying two floating info cards. */}
      <section className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
        <div className="container-tight relative pb-16 pt-20 md:pt-28">
          {signedIn ? (
            <div className="flex flex-col items-center text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/brand-lockup.png" alt="TailoredIQ" className="mb-6 h-10 w-auto" />
              <h1 className="max-w-6xl text-balance text-[54px] font-semibold leading-[1.2] tracking-normal">
                {hero.title}
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {hero.subtitle}
              </p>
              <div className="mt-10">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center gap-2 rounded-full bg-mkt-cta px-5 py-3 text-base font-semibold text-mkt-cta-ink transition hover:bg-mkt-cta/90"
                >
                  Go to dashboard <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid items-start gap-8 md:grid-cols-[1.4fr_1fr] md:gap-12">
              <div>
                <span className="eyebrow mb-6 inline-flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/landing/brand-icon.png" alt="" className="size-3.5 object-contain" />{" "}
                  {hero.eyebrow}
                </span>
                <h1 className="text-balance text-[54px] font-semibold leading-[1.2] tracking-normal text-mkt-text">
                  {hero.title}
                </h1>
              </div>
              <div className="flex flex-col items-start gap-[17px] md:pt-[52px]">
                <p className="text-lg leading-relaxed text-muted-foreground">{hero.subtitle}</p>
                <Link
                  href={primaryHref}
                  className="inline-flex items-center justify-center rounded-full bg-gold px-[14px] py-[12.5px] text-[18px] font-semibold text-primary-foreground transition hover:brightness-110"
                >
                  {hero.ctaLabel}
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="container-tight relative pb-24 md:pb-32">
          <div className="relative hidden aspect-[1232/568] w-full overflow-hidden rounded-[30px] sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/expert-hero/hero-photo.jpg"
              alt="An experienced professional advising a founder over a laptop"
              className="absolute inset-0 size-full object-cover"
            />
            <div
              aria-hidden
              className="absolute -left-10 bottom-0 size-[284px] translate-y-1/2 rounded-full bg-gold/40 blur-3xl"
            />

            {/* "Expert Contributor" stat badge */}
            <div className="absolute right-8 top-8 hidden items-center gap-4 rounded-full bg-black/60 px-3 py-3 backdrop-blur-sm md:flex">
              <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-gold">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/landing/expert-hero/brain-icon.svg" alt="" className="size-6" />
              </div>
              <div>
                <div className="text-xs tracking-wide text-white/50">EXPERT CONTRIBUTOR</div>
                {/* Literal white, not --mkt-text: this sits on a black/60 scrim
                    over the photo, which stays dark in both themes. */}
                <div className="text-base text-white">28 years operating</div>
              </div>
            </div>

            {/* Sample advisory exchange card */}
            <div className="absolute bottom-8 left-8 hidden w-[301px] rounded-[24px] bg-black/60 p-6 backdrop-blur-sm md:block">
              <div className="relative flex flex-col gap-5">
                <div aria-hidden className="absolute bottom-8 left-[6px] top-3 w-px bg-white/20" />
                {HERO_SAMPLE_EXCHANGE.map((item) => (
                  <div key={item.label} className="flex gap-3">
                    <span className="mt-1 size-3.5 shrink-0 rounded-full border border-[#aeaead]" />
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-white/50">{item.label}</span>
                      {/* Literal white for the same scrim reason as above. */}
                      <span className="text-sm leading-[1.4] text-white">{item.body}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-white/15 pt-4">
                <span className="text-sm font-medium text-gold">Share your experience →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {afterHero}

      {/* WHAT IT COVERS */}
      <section className="container-tight py-24 md:py-32">
        <Reveal className="mx-auto max-w-3xl text-center">
          <SectionLabel>{prioritiesEyebrow}</SectionLabel>
          <h2 className="mt-5 text-balance text-[34px] font-semibold leading-[1.2] tracking-normal md:text-[48px]">
            {prioritiesTitle}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{prioritiesIntro}</p>
        </Reveal>

        <div className="mt-14 grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {priorities.map((p, i) => (
            // Capped so a ten-item list still finishes arriving inside 300ms.
            <Reveal key={p} delay={Math.min(i, 5) * 60} y={12} className="flex items-start gap-3">
              <Check className="mt-1 size-4.5 shrink-0 text-gold" aria-hidden />
              <span className="text-lg text-foreground/90">{p}</span>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} y={12}>
          <p className="mx-auto mt-12 max-w-2xl text-center text-lg italic text-muted-foreground">
            If it is on your plate this quarter, someone in the network has done it before — at your
            scale, in your context.
          </p>
        </Reveal>
      </section>

      {afterPriorities}

      {/* QUOTE */}
      <section className="container-tight py-20 md:py-28">
        <Reveal className="mx-auto max-w-4xl text-center">
          <blockquote className="font-display text-lg leading-tight md:text-2xl">
            &ldquo;The right insight can change the quality of a decision. TailoredIQ exists to help
            leaders move forward with greater clarity, confidence, and context.&rdquo;
          </blockquote>
        </Reveal>
      </section>

      <FounderNote />

      {/* TRUSTED BY — logo marquee */}
      <section className="overflow-hidden bg-surface py-14">
        <div className="container-tight mb-8 text-center">
          <SectionLabel>Trusted by</SectionLabel>
        </div>
        <div className="logo-marquee">
          <div className="logo-marquee-track">
            {CLIENT_LOGOS.concat(CLIENT_LOGOS).map(({ name, mono }, i) => (
              <div key={i} className="logo-marquee-item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mono} alt={name} className="logo-marquee-mono" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {bottomCta}

      <Footer />
    </div>
  );
}
