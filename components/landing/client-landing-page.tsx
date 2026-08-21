"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { BookOpen, Clock, UserCircle } from "@/components/icons";
import { Navigation } from "@/components/landing/navigation";
import { Footer } from "@/components/landing/footer";
import { FounderNote } from "@/components/landing/founder-note";
import { HeroPortraitCollage } from "@/components/landing/hero-portrait-collage";
import { HeroChallengeInput } from "@/components/landing/hero-challenge-input";
import { HowItWorksScroller } from "@/components/landing/how-it-works-scroller";
import {
  TestimonialsFilmstrip,
  type Testimonial,
} from "@/components/landing/testimonials-filmstrip";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useInViewOnce } from "@/hooks/use-in-view-once";
import { useSessionStore } from "@/lib/store/use-session-store";
import { useHydrated } from "@/hooks/use-hydrated";

/**
 * The marketing home page. Ported from the landing-page project's
 * components/ClientLandingPage.tsx.
 *
 * Mechanical changes across the whole file: TanStack `<Link to>` -> next/link
 * `<Link href>`, bundler asset imports -> public/landing/ URL strings, lucide
 * icons -> this app's Hugeicons-backed set (which takes a `className` rather
 * than a numeric `size` prop), and `useAuth` -> `useSessionStore`.
 */

// Monochrome only — the marquee never reveals a colour logo (see
// .logo-marquee-mono in globals.css), so the full-colour assets aren't
// referenced here at all.
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

const TRUST_STATS = [
  { icon: UserCircle, label: "Built from 500+ business leaders" },
  { icon: BookOpen, label: "Expert-validated playbooks" },
  { icon: Clock, label: "20yr+ Average experience" },
];

// Inline CSS custom properties for the hero's staggered entrance — plain
// object keys aren't in React's CSSProperties type, hence the cast.
function heroDelayStyle(delayMs: number, riseFrom = 12): CSSProperties {
  return {
    ["--hero-delay" as string]: `${delayMs}ms`,
    ["--hero-rise" as string]: `${riseFrom}px`,
  } as CSSProperties;
}

const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_OUT_BACK = "cubic-bezier(0.34, 1.56, 0.64, 1)";

// "What Your Playbook Includes" grid entrance — driven by the section's own
// inView flag rather than a CSS animation class, since (unlike the hero) this
// fires once on scroll-into-view rather than once on page load.
function cardEntranceStyle(
  inView: boolean,
  delayMs: number,
  reducedMotion: boolean,
): CSSProperties {
  if (reducedMotion) {
    return { opacity: inView ? 1 : 0, transition: "opacity 300ms ease-out" };
  }
  // `translate` is listed here (0 delay, its own shorter duration) purely so
  // the card's hover:-translate-y-0.5 lift can interpolate at all: this
  // inline style sits directly on the card and always outranks the
  // hover:translate-y class on that same element, so unless `translate` is
  // explicitly part of this transition list the hover lift would snap. The
  // entrance itself never touches `translate`, only `transform`.
  return {
    opacity: inView ? 1 : 0,
    transform: inView ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 450ms ${EASE_OUT}, transform 450ms ${EASE_OUT}, translate 200ms ${EASE_OUT}`,
    transitionDelay: `${delayMs}ms, ${delayMs}ms, 0ms`,
  };
}

// The folder papers' resting transform already composes centring with their
// final rotation — the entrance drift has to compose into that same string,
// not replace it, or the papers lose their centring the moment it starts.
//
// Hover ("papers jumping out of the folder"): all three rise, each further
// than the last, and each fans open wider by rotating further in whichever
// direction it already leans. A short stagger sells "pulled as a stack"
// rather than all three snapping in lockstep.
function paperEntranceStyle(
  inView: boolean,
  finalRotate: number,
  entranceDelayMs: number,
  reducedMotion: boolean,
  hovered: boolean,
  hoverRiseY: number,
  hoverRotateDelta: number,
  hoverDelayMs: number,
  entranceSettled: boolean,
): CSSProperties {
  if (reducedMotion) {
    return {
      transform: `translate(-50%, -50%) rotate(${finalRotate}deg)`,
      opacity: inView ? 1 : 0,
      transition: "opacity 300ms ease-out",
    };
  }
  const offsetY = inView ? (hovered ? hoverRiseY : 0) : 20;
  const rotate = inView ? finalRotate + (hovered ? hoverRotateDelta : 0) : finalRotate * 0.3;
  // Once the staggered entrance has finished, transition-delay drops to the
  // much shorter hover stagger — otherwise hover inherits the entrance's
  // per-paper delay and lags behind the cursor by up to ~500ms.
  return {
    transform: `translate(-50%, calc(-50% + ${offsetY}px)) rotate(${rotate}deg)`,
    opacity: inView ? 1 : 0.6,
    transition: `transform 450ms ${EASE_OUT_BACK}, opacity 450ms ${EASE_OUT_BACK}`,
    transitionDelay: entranceSettled ? `${hovered ? hoverDelayMs : 0}ms` : `${entranceDelayMs}ms`,
  };
}

// "From Challenge to Clarity" — a stack of sticky panels the user scrolls
// through, each covering the previous one (see HowItWorksScroller). Numbers
// are 01-04: the Figma file labels steps 3 and 4 both "04", which reads as a
// content typo upstream rather than a deliberate choice.
const HOW_IT_WORKS = [
  {
    number: "01",
    icon: "/landing/how-it-works/icon1.svg",
    image: "/landing/how-it-works/step1.webp",
    title: "Tell us what you're facing",
    body: "Chat with TailoredIQ about your challenge. We'll ask the right questions to understand your situation and turn it into a clear brief.",
  },
  {
    number: "02",
    icon: "/landing/how-it-works/icon2.svg",
    image: "/landing/how-it-works/step2.webp",
    title: "Get clarity on your options",
    body: "Receive a concise executive summary that breaks down your challenge, highlights key considerations, and outlines possible ways forward.",
  },
  {
    number: "03",
    icon: "/landing/how-it-works/icon3.svg",
    image: "/landing/how-it-works/step3.webp",
    title: "Connect with the right expert",
    body: "Get matched with a vetted expert whose experience aligns with your challenge, so you can get practical, context-specific guidance.",
  },
  {
    number: "04",
    icon: "/landing/how-it-works/icon4.svg",
    image: "/landing/how-it-works/step4.webp",
    title: "Get a tailored Playbook",
    body: "Turn the insights into a practical, step-by-step plan you can act on—before or after speaking with an expert.",
  },
];

const PLAYBOOK_INCLUDES_LEFT = [
  {
    icon: "/landing/playbook/ai-search-lines.svg",
    title: "Executive Summary",
    body: "A concise overview of your challenge and the recommended strategic direction.",
  },
  {
    icon: "/landing/playbook/lightbulb.svg",
    title: "Key Insights",
    body: "The critical observations and patterns influencing your decision.",
  },
  {
    icon: "/landing/playbook/work.svg",
    title: "Why This Works",
    body: "The thinking, research, and real-world experience behind each recommendation.",
  },
];

const PLAYBOOK_INCLUDES_RIGHT = [
  {
    icon: "/landing/playbook/stairs-02.svg",
    title: "Recommended Actions",
    body: "A practical implementation plan with prioritised actions tailored to your specific situation.",
  },
  {
    icon: "/landing/playbook/keyframes-double.svg",
    title: "Practical Frameworks",
    body: "Decision-making frameworks, templates, and models you can immediately apply.",
  },
  {
    icon: "/landing/playbook/question.svg",
    title: "Expert Support",
    body: "If you need additional guidance, book a session with experts behind the recommendations.",
  },
];

// Percentages against the illustration's own design-space box (401 x 255,
// the Figma folder graphic's bounding box incl. the paper overhang) so the
// fanned pages scale with the card instead of needing a fixed canvas.
const PLAYBOOK_FOLDER_PAPERS = [
  { left: 25.26, top: 44.91, height: 84.33, rotate: -4.42 },
  { left: 51.84, top: 49.21, height: 81.48, rotate: 3.23 },
  { left: 76.62, top: 25.82, height: 88.36, rotate: 8.09 },
];

// Two alternating pill fills from the Figma spec, kept per item (the source
// pattern breaks a simple odd/even formula) so the sequence matches exactly.
const CHALLENGES = [
  { label: "Entering a new market", bg: "#1C1B18" },
  { label: "Scaling operations without losing efficiency", bg: "#302D24" },
  { label: "Raising capital or planning your next funding round", bg: "#302D24" },
  { label: "Building a stronger leadership team", bg: "#1C1B18" },
  { label: "Navigating regulatory and stakeholder challenges", bg: "#1C1B18" },
  { label: "Implementing AI across your organization", bg: "#302D24" },
  { label: "Preparing for board meetings and governance", bg: "#302D24" },
  { label: "Leading organizational change", bg: "#1C1B18" },
  { label: "Planning founder succession and leadership transitions", bg: "#1C1B18" },
  { label: "Hiring and retaining top talent", bg: "#302D24" },
  { label: "Building strategic partnerships across markets", bg: "#302D24" },
  { label: "Integrating acquisitions successfully", bg: "#1C1B18" },
  { label: "Much more", bg: "#302D24" },
];

// Dealt into two rows by alternating index rather than splitting the list in
// half, so neither row ends up holding a run of the long labels (or of one
// background fill) while the other holds the short ones. Durations differ
// because the rows carry different total widths — matching them would make
// the wider row travel visibly faster than its neighbour.
const CHALLENGE_ROWS = [
  { items: CHALLENGES.filter((_, i) => i % 2 === 0), durationSeconds: 55 },
  { items: CHALLENGES.filter((_, i) => i % 2 === 1), durationSeconds: 48 },
];

// Closing-CTA avatar mosaic — the exact 11-column x 7-row layout from the
// Figma spec (54 hand-placed tiles out of 77 possible cells; the missing
// ones are gaps, not muted tiles). '.' = no cell, 'E' = empty tile, 'P' = one
// of the 10 photo slots. Rows 2-4 leave columns 3-7 empty entirely — that's
// the hole the heading/subtext/button sit in, so text never overlaps a tile
// at all rather than relying on z-index or contrast.
const MOSAIC_COLS = 11;
const MOSAIC_PATTERN = [
  "..EPEEEPE..",
  "EPEEEPEEEPE",
  "EEE.....EEE",
  "EEE.....EEE",
  "EPE.....EPE",
  "EEEPEEEPEEE",
  "..EEEPEEE..",
];
const MOSAIC_PHOTO_SLOTS = MOSAIC_PATTERN.flatMap((row, r) =>
  [...row].flatMap((ch, c) => (ch === "P" ? [r * MOSAIC_COLS + c] : [])),
);

// The exact 10 photos from the Figma spec, in the same order as
// MOSAIC_PHOTO_SLOTS (row-major) — curated imagery rather than live expert
// avatars, same rationale as EXPERTS_SHOWCASE below.
const CTA_MOSAIC_PHOTOS = [
  "/landing/cta-mosaic/rect41.jpg",
  "/landing/cta-mosaic/rect44.jpg",
  "/landing/cta-mosaic/rect16.jpg",
  "/landing/cta-mosaic/rect20.jpg",
  "/landing/cta-mosaic/rect24.jpg",
  "/landing/cta-mosaic/rect30.jpg",
  "/landing/cta-mosaic/rect37.jpg",
  "/landing/cta-mosaic/rect49.jpg",
  "/landing/cta-mosaic/rect54.jpg",
  "/landing/cta-mosaic/rect64.jpg",
];

// Testimonial #2 (Timothy Ayomide) is the one real quote supplied so far
// (Figma spec). The other 3 are PLACEHOLDER copy written to exercise the
// filmstrip's 4-way layout — swap for real quotes as they arrive.
const TESTIMONIALS: Testimonial[] = [
  {
    photo: "/landing/testimonials/testimonial-1.jpg",
    objectPosition: "45% 0%",
    quote:
      "We came in with three options and no clear way to compare them. TailoredIQ broke down the trade-offs in a way our board actually understood.",
    name: "Adaeze Nwosu",
    title: "VP of Strategy, Meridian Holdings",
  },
  {
    photo: "/landing/testimonials/testimonial-2.jpg",
    objectPosition: "50% 46%",
    quote:
      "TailoredIQ helped us evaluate our expansion strategy from multiple angles. The recommendations were practical, structured, and gave our leadership team confidence to move forward.",
    name: "Timothy Ayomide",
    title: "Founder & CEO, Horizon Logistics",
  },
  {
    photo: "/landing/testimonials/testimonial-3.jpg",
    // The one source photo shot wide rather than as a tight head crop, so it
    // needs a real zoom to sit at the same scale as the other three — see
    // `zoom`/`shift` on the Testimonial type. The object-position Y is for
    // the mobile carousel, whose 4/5 panel is wider than the source and so
    // crops vertically (the desktop strip is narrower and crops sideways,
    // where a Y value has nothing to act on).
    objectPosition: "50% 18%",
    zoom: 1.65,
    shift: "7%",
    quote:
      "What stood out was how fast we went from a vague problem to an actual plan. It felt like having a consultant on call.",
    name: "Kwame Boateng",
    title: "Managing Director, Ashanti Ventures",
  },
  {
    photo: "/landing/testimonials/testimonial-4.jpg",
    objectPosition: "54% 57%",
    quote:
      "The playbook didn't just tell us what to do — it explained why, with examples from people who'd actually solved similar problems.",
    name: "Ngozi Adeyemi",
    title: "COO, Lattice Retail Group",
  },
];

// The exact 3 people/photos from the Figma "Meet the experts" spec, used as
// curated homepage showcase content rather than the live directory query —
// this guarantees real photos render here regardless of which experts have
// uploaded avatars in a given environment. The live directory itself
// (linked via "Explore Our Expert Network") stays data-driven.
//
// yearsExperience is illustrative placeholder content, not a verified fact
// about these individuals — swap in real figures before this is treated as a
// factual claim about a named person.
const EXPERTS_SHOWCASE = [
  {
    name: "Stanley Eluwa",
    title: "Human Resources and Corporate Services Director",
    company: "Promasidor",
    yearsExperience: 18,
    categories: [
      "People, Organisation & Leadership",
      "Strategy, Governance & Transformation",
      "Operations & Performance",
    ],
    photo: "/landing/experts/expert-stanley-eluwa.jpg",
    objectPosition: "52% 0%",
  },
  {
    name: "Teju Fola-Alade",
    title: "Head of Human Resources",
    company: "Rova",
    yearsExperience: 14,
    categories: [
      "People, Organisation & Leadership",
      "Strategy, Governance & Transformation",
      "Operations & Performance",
    ],
    photo: "/landing/experts/expert-teju-fola-alade.jpg",
    objectPosition: "42% 8%",
  },
  {
    name: "Ina Alogwu",
    title: "Chief Digital and Innovation Officer",
    company: "T2mobile NG",
    yearsExperience: 16,
    categories: [
      "Strategy, Governance & Transformation",
      "Legal, Regulatory & Sustainability",
      "Operations & Performance",
    ],
    photo: "/landing/experts/expert-ina-alogwu.jpg",
    objectPosition: "38% 0%",
  },
];

// Fixed photo slots from the Figma layout, filled row-major with the curated
// photos — a plain module-level Map since both inputs are static.
const MOSAIC_PLACEMENT = new Map<number, string>(
  MOSAIC_PHOTO_SLOTS.map((cell, i) => [cell, CTA_MOSAIC_PHOTOS[i]]),
);

// Deterministic pseudo-random hash (not Math.random()) — this is server
// rendered, and module-scope Math.random() would bake different values into
// the server HTML than the client's re-evaluation of this module, producing a
// hydration mismatch on every one of these tiles. A pure function of the cell
// index gives the same scattered look on both sides for free.
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Per-tile entrance stagger: a small index-based base (roughly left-to-right
// on average) swamped by up to 400ms of hashed jitter, so the reveal order
// reads as scattered rather than a wipe. Photo tiles get a flat +90ms so
// avatars populate a beat after the empty tiles, without a hard two-step
// split (the jitter range is wider than that offset, so the two populations
// overlap heavily). Computed once at module scope — no per-tile JS timers.
const MOSAIC_ENTRANCE_DELAYS = new Map<number, number>();
MOSAIC_PATTERN.forEach((row, r) => {
  [...row].forEach((ch, c) => {
    if (ch === ".") return;
    const cell = r * MOSAIC_COLS + c;
    const base = cell * 3;
    const jitter = pseudoRandom(cell + 1) * 400;
    const photoExtra = ch === "P" ? 90 : 0;
    MOSAIC_ENTRANCE_DELAYS.set(cell, Math.round(base + jitter + photoExtra));
  });
});

// At most 2 empty tiles get the idle shimmer, picked deterministically rather
// than the first/last so it doesn't read as a fixed pattern. Their
// animation-delays are staggered by half the keyframe cycle so at most one is
// ever mid-pulse.
const MOSAIC_EMPTY_CELLS = MOSAIC_PATTERN.flatMap((row, r) =>
  [...row].flatMap((ch, c) => (ch === "E" ? [r * MOSAIC_COLS + c] : [])),
);
const MOSAIC_SHIMMER_CELLS = [...MOSAIC_EMPTY_CELLS]
  .sort((a, b) => pseudoRandom(a + 1000) - pseudoRandom(b + 1000))
  .slice(0, 2);

export function ClientLandingPage() {
  const hydrated = useHydrated();
  const user = useSessionStore((s) => s.user);
  const signedIn = hydrated && !!user;

  // Signed in, the primary CTA goes straight into the app; signed out it
  // goes to sign-up. (The source project passed a `role` search param to its
  // own /signup route; this app's sign-up has no such param.)
  const getStartedHref = signedIn ? "/dashboard" : "/sign-up";
  // /experts lives inside the authenticated (app) group, so pointing a
  // logged-out visitor at it would just bounce them to /sign-in. Sending
  // them to sign-up instead matches the source project's own "join to see
  // the network" gate on the About page.
  const expertNetworkHref = signedIn ? "/experts" : "/sign-up";

  // Next's App Router restores scroll on navigation, which can stomp a
  // same-tick scroll-to-hash. Deferring two animation frames lets that
  // settle first, so this one wins.
  useEffect(() => {
    if (!window.location.hash) return;
    const id = window.location.hash.slice(1);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView();
      });
    });
  }, []);

  // Hero exit parallax: the badge/avatar-grid group recedes roughly twice as
  // fast as the headline/CTA group as the user scrolls past, so the CTA area
  // reads as anchored while the decorative grid recedes. Applied as inline
  // style on wrappers *outside* the entrance-animation elements — CSS
  // animations win the cascade for the properties they animate, so driving
  // opacity/transform on the same node from both would fight the entrance.
  //
  // Written straight to the DOM via refs, not React state: this page is a big
  // tree, and re-rendering all of it on every scroll frame — which a setState
  // here would do — competed with the browser's own scroll/paint work and
  // made scrolling feel stuttery well beyond the hero itself. Both are cheap
  // compositor-only properties, so direct style writes are enough for 60fps.
  const heroRef = useRef<HTMLElement>(null);
  const recedeGroupRef = useRef<HTMLDivElement>(null);
  const anchoredGroupRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = heroRef.current;
    const recede = recedeGroupRef.current;
    const anchored = anchoredGroupRef.current;
    if (!el || !recede || !anchored) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const heroScroll = Math.min(1, Math.max(0, -rect.top / (rect.height || 1)));
      recede.style.opacity = String(1 - Math.min(1, heroScroll * 2.2));
      recede.style.transform = `translateY(${-heroScroll * 24}px)`;
      anchored.style.opacity = String(1 - Math.min(1, heroScroll * 1.1));
      anchored.style.transform = `translateY(${-heroScroll * 8}px)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const reducedMotion = useReducedMotion();
  const { ref: playbookGridRef, inView: playbookInView } = useInViewOnce<HTMLDivElement>({
    threshold: 0.15,
  });
  const { ref: mosaicRef, inView: mosaicInView } = useInViewOnce<HTMLDivElement>({ threshold: 0.1 });
  const { ref: expertsRef, inView: expertsInView } = useInViewOnce<HTMLDivElement>({
    threshold: 0.2,
  });
  const { ref: challengesRef, inView: challengesInView } = useInViewOnce<HTMLDivElement>({
    threshold: 0.1,
  });
  const [folderHovered, setFolderHovered] = useState(false);
  // Papers keep their staggered entrance transition-delay until the sequence
  // has visually settled, then drop it to 0 so the hover nudge doesn't
  // inherit that lag.
  const [papersSettled, setPapersSettled] = useState(false);
  useEffect(() => {
    if (!playbookInView) return;
    const lastPaperDelay = 270 + (PLAYBOOK_FOLDER_PAPERS.length - 1) * 130;
    const timer = setTimeout(() => setPapersSettled(true), lastPaperDelay + 450 + 50);
    return () => clearTimeout(timer);
  }, [playbookInView]);

  return (
    <div className="marketing-shell flex min-h-screen flex-col bg-mkt-page">
      <Navigation heroEntrance />

      {/* HERO — one orchestrated load-in sequence (nav -> badge -> avatar
          cascade -> headline -> subtext -> input -> stats), all on the same
          ease-out curve, no bounce. The avatar cascade runs outer columns
          inward so the grid reads as assembling toward the centre rather
          than a uniform left-to-right pop. */}
      <section ref={heroRef} className="relative overflow-hidden bg-mkt-page">
        <div aria-hidden className="hero-ambient-glow -z-10" />
        <div className="container-tight relative flex flex-col items-center pb-24 pt-16 text-center md:pb-32 md:pt-[99px]">
          <div ref={recedeGroupRef} className="flex flex-col items-center">
            <div
              className="hero-anim-up mb-0 flex items-center gap-[7px]"
              style={heroDelayStyle(120, 8)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/landing/hero-trusted-badge-icon.svg"
                alt=""
                className="hero-badge-dot-blink h-4 w-4"
              />
              <span className="text-[18px] font-medium text-mkt-text-mute">
                Trusted by leaders behind Africa&apos;s Experience Capital
              </span>
            </div>

            <HeroPortraitCollage parallaxSourceRef={heroRef} />
          </div>

          <div ref={anchoredGroupRef} className="flex flex-col items-center">
            <div className="flex max-w-[738px] flex-col items-center gap-[10px]">
              <h1
                className="hero-anim-up text-balance text-[54px] font-semibold leading-[1.2] tracking-normal text-mkt-text"
                style={heroDelayStyle(420, 12)}
              >
                Make better decisions with Africa&apos;s Experience Capital.
              </h1>
              <p
                className="hero-anim-up max-w-[596px] text-lg font-medium leading-[1.4] text-mkt-text-mute"
                style={heroDelayStyle(500, 10)}
              >
                Describe your challenge and receive a personalized Playbook inspired by the
                experience of leaders who&apos;ve solved similar challenges.
              </p>
            </div>

            <div
              className="hero-anim-up mt-[30px] flex w-full justify-center"
              style={heroDelayStyle(590, 10)}
            >
              <HeroChallengeInput />
            </div>

            <div
              className="hero-anim-up mt-[35px] flex flex-wrap items-center justify-center gap-x-[20px] gap-y-3"
              style={heroDelayStyle(680, 10)}
            >
              {TRUST_STATS.map((s) => (
                <div key={s.label} className="flex items-center gap-[6px] text-sm text-mkt-text-soft">
                  <s.icon className="size-[18px] shrink-0" aria-hidden />
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — "From Challenge to Clarity". Photos are pre-composed
          marketing assets (the chat/report/call/playbook UI mockups,
          including rounded corners, are baked into the images themselves,
          not something to reconstruct with CSS). */}
      <section
        id="how-it-works"
        className="bg-mkt-panel pt-16 scroll-mt-[calc(var(--nav-height)+2rem)] md:pt-24"
      >
        <div className="container-tight text-center">
          <h2 className="text-4xl font-semibold tracking-normal md:text-5xl">
            From Challenge to Clarity
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Turn business challenges into expert-inspired action plans in minutes.
          </p>
        </div>

        <div className="mt-5">
          <HowItWorksScroller steps={HOW_IT_WORKS} />
        </div>
      </section>

      {/* WHAT YOUR PLAYBOOK INCLUDES */}
      <section className="bg-mkt-sand py-24 md:py-32">
        <div className="container-tight">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-semibold tracking-normal md:text-5xl">
              What Your Playbook Includes
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Every Playbook is tailored to your challenge, combining strategic insight, practical
              recommendations, and proven expertise to help you move forward with confidence.
            </p>
          </div>

          {/* Entrance is one staggered group triggered by IntersectionObserver
              (fires once, never replays), not a sequential reveal: outer cards
              settle in column order ~60ms apart while the centre card and its
              papers arrive last, ~150ms after, as the payoff. */}
          <div
            ref={playbookGridRef}
            className="mt-14 grid items-stretch gap-5 md:grid-cols-[1fr_1.7fr_1fr] md:gap-7"
          >
            <div className="flex flex-col gap-5">
              {PLAYBOOK_INCLUDES_LEFT.map((item, i) => (
                <div
                  key={item.title}
                  className="group relative rounded-[40px] bg-mkt-card p-6 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
                  style={cardEntranceStyle(playbookInView, i * 60, reducedMotion)}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-[40px] opacity-0 shadow-[0_16px_32px_-12px_rgba(0,0,0,0.5)] transition-opacity duration-200 ease-out group-hover:opacity-100 motion-reduce:group-hover:opacity-0"
                  />
                  <div
                    className="relative mb-3 flex h-11 w-11 items-center justify-center rounded-full transition-[filter] duration-200 ease-out group-hover:brightness-110"
                    style={{ background: "linear-gradient(180deg, #3d3b33 0%, #55524a 100%)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.icon} alt="" className="h-6 w-6" />
                  </div>
                  <h3 className="relative font-display text-[20px] font-semibold text-mkt-text">
                    {item.title}
                  </h3>
                  <p className="relative mt-1.5 text-sm leading-relaxed text-mkt-text-mute">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>

            <div
              className="flex flex-col items-center rounded-[40px] bg-mkt-card p-8 text-center"
              style={cardEntranceStyle(playbookInView, 270, reducedMotion)}
            >
              <span className="inline-flex items-center rounded-full bg-[#3a3107] px-5 py-1.5 text-sm font-semibold text-gold">
                Sample
              </span>
              <h3 className="mt-3 font-display text-4xl font-semibold text-mkt-text">Playbook</h3>

              <div
                className="relative mx-auto mt-8 w-full max-w-[401px]"
                style={{ aspectRatio: "401 / 255" }}
                onMouseEnter={() => setFolderHovered(true)}
                onMouseLeave={() => setFolderHovered(false)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/landing/playbook/folder.svg"
                  alt=""
                  className="absolute left-0 top-0 w-full"
                  style={{ height: "94.5%" }}
                />

                {/* Fanned paper sheets — the signature moment: pulled up out of
                    the folder back-to-front (array order already matches that
                    visual stacking), settling with a slight ease-out-back
                    overshoot. The only spot in this section using that curve. */}
                <div
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "17.9%",
                    width: "83.4%",
                    height: "81.9%",
                    transform: "translateX(-50%)",
                  }}
                >
                  {PLAYBOOK_FOLDER_PAPERS.map((p, i) => (
                    <div
                      key={p.rotate}
                      className="absolute rounded-[19px] bg-mkt-cta shadow-[0px_3px_16px_0px_rgba(0,0,0,0.15)]"
                      style={{
                        left: `${p.left}%`,
                        top: `${p.top}%`,
                        width: "46.6%",
                        height: `${p.height}%`,
                        ...paperEntranceStyle(
                          playbookInView,
                          p.rotate,
                          270 + i * 130,
                          reducedMotion,
                          folderHovered,
                          -(18 + i * 8),
                          p.rotate >= 0 ? 5 : -5,
                          (PLAYBOOK_FOLDER_PAPERS.length - 1 - i) * 35,
                          papersSettled,
                        ),
                      }}
                    >
                      <div
                        className="absolute left-[10%] top-[11%] flex w-[75%] flex-col gap-[6%]"
                        style={{ height: "30%" }}
                      >
                        <div className="h-[28%] w-full rounded-full bg-[#eee]" />
                        <div className="h-[28%] w-[65%] rounded-full bg-[#eee]" />
                        <div className="h-[28%] w-[48%] rounded-full bg-[#eee]" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Yellow label area on the folder's bottom third */}
                <div
                  className="absolute inset-x-0 bottom-[5.5%] rounded-b-[40px] bg-[#e4b716] px-6 pb-6 pt-4 text-left"
                  style={{ boxShadow: "inset 0 -14px 24px 0 rgba(153,0,29,0.15)" }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#403920]">
                    Playbook
                  </p>
                  <p className="mt-1 text-lg font-semibold leading-snug text-primary-foreground">
                    Strategic Action Playbook for Market Expansion
                  </p>
                </div>
              </div>

              <Link
                href={getStartedHref}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-mkt-cta px-5 py-3 text-base font-semibold text-mkt-cta-ink transition-[scale,filter] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:brightness-110 motion-reduce:hover:scale-100"
              >
                Download Sample
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/landing/playbook/arrow-down-03.svg" alt="" className="h-6 w-6" />
              </Link>
            </div>

            <div className="flex flex-col gap-5">
              {PLAYBOOK_INCLUDES_RIGHT.map((item, i) => (
                <div
                  key={item.title}
                  className="group relative rounded-[40px] bg-mkt-card p-6 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
                  style={cardEntranceStyle(playbookInView, i * 60, reducedMotion)}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-[40px] opacity-0 shadow-[0_16px_32px_-12px_rgba(0,0,0,0.5)] transition-opacity duration-200 ease-out group-hover:opacity-100 motion-reduce:group-hover:opacity-0"
                  />
                  <div
                    className="relative mb-3 flex h-11 w-11 items-center justify-center rounded-full transition-[filter] duration-200 ease-out group-hover:brightness-110"
                    style={{ background: "linear-gradient(180deg, #3d3b33 0%, #55524a 100%)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.icon} alt="" className="h-6 w-6" />
                  </div>
                  <h3 className="relative font-display text-[20px] font-semibold text-mkt-text">
                    {item.title}
                  </h3>
                  <p className="relative mt-1.5 text-sm leading-relaxed text-mkt-text-mute">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MEET THE EXPERTS — curated static showcase (the exact 3 people and
          photos from the Figma spec), not the live directory query: real
          registered experts don't reliably have uploaded avatars in every
          environment, which looked broken next to the rest of the marketing
          page. The live directory is one click away.

          Entrance: cards sweep left to right (--card-delay = index * 135ms)
          rather than the CTA mosaic's scattered reveal — 3 items read as a
          deliberate sequence, not a mosaic assembling. Each card is a
          tabIndex=0 group (not a link — there's no confirmed per-expert
          destination for this curated showcase) so keyboard users get a real
          focus stop that triggers the same gold-tags state as a mouse, via
          :focus-within in CSS. */}
      <section className="bg-mkt-panel py-24 md:py-32">
        <div className="container-tight">
          <div className="mb-[42px] flex flex-wrap items-start justify-between gap-6">
            <div className={`experts-header ${expertsInView ? "experts-in" : ""}`}>
              <h2 className="whitespace-nowrap text-4xl font-semibold tracking-normal md:text-5xl">
                Meet the experts
              </h2>
              <p className="mt-4 max-w-md text-lg text-muted-foreground">
                Senior operators and advisors whose knowledge powers your answers.
              </p>
            </div>
            <Link
              href={expertNetworkHref}
              className={`experts-cta ${expertsInView ? "experts-in" : ""} inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-mkt-cta px-[14px] py-[12.5px] text-[18px] font-semibold text-mkt-cta-ink transition-colors hover:bg-mkt-cta/90`}
            >
              Explore Our Expert Network
            </Link>
          </div>

          <div
            ref={expertsRef}
            className="grid gap-x-[21px] gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
          >
            {EXPERTS_SHOWCASE.map((e, i) => (
              <div
                key={e.name}
                className="expert-card flex flex-col gap-[26px] rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                style={{ "--card-delay": `${i * 135}ms` } as CSSProperties}
                tabIndex={0}
                role="group"
                aria-label={`${e.name}, ${e.title} at ${e.company}`}
              >
                <div
                  className={`expert-photo-wrap ${expertsInView ? "experts-in" : ""} relative w-full overflow-hidden`}
                  style={{ aspectRatio: "397 / 346" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={e.photo}
                    alt=""
                    className="expert-photo-img absolute inset-0 h-full w-full object-cover"
                    style={{ objectPosition: e.objectPosition }}
                  />
                </div>
                <div
                  className={`expert-text ${expertsInView ? "experts-in" : ""} flex flex-col gap-3`}
                >
                  <div className="flex flex-col gap-1.5">
                    <h3 className="truncate text-2xl font-bold leading-none text-mkt-text">
                      {e.name}
                    </h3>
                    {/* Title and company are always two separate lines (not one
                        string left to wrap) so every card reserves the same
                        height here regardless of title length — years and tags
                        below then start on the same row across all 3 cards
                        instead of drifting per card. */}
                    <p className="truncate text-sm leading-snug text-mkt-text-soft">{e.title}</p>
                    <p className="truncate text-sm leading-snug text-mkt-text-soft">at {e.company}</p>
                    <p className="flex items-center gap-1.5 text-sm text-gold">
                      <Clock className="size-3.5 shrink-0" aria-hidden /> {e.yearsExperience}+ years
                      experience
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-[13px]">
                    {e.categories.map((c, ti) => (
                      <span
                        key={c}
                        className="expert-tag inline-flex items-center whitespace-nowrap rounded-full border px-3 py-[7px] text-xs font-medium"
                        style={{ "--tag-delay": `${ti * 50}ms` } as CSSProperties}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHALLENGES WE HELP SOLVE — two rows drifting continuously in
          opposite directions (see .challenge-marquee in globals.css) rather
          than the flat wrapped grid this was: the full set is 13 pills, which
          wrapped to seven stacked rows and turned a supporting detail into
          the tallest block on the page.

          The rows sit outside container-tight, unlike the heading, so they
          run edge to edge — a marquee that stops at a centred column's
          gutter reads as a clipped list rather than something continuous.

          The observed ref sits on the rows specifically, not the whole
          header+rows container: this section is tall, and watching the outer
          container at threshold 0.1 meant the entrance could fire and finish
          while only the heading had scrolled into view, reading as "no
          animation" even though it ran. */}
      <section className="overflow-hidden bg-mkt-page py-24 md:py-32">
        <div className="container-tight">
          <div
            className="mb-10 flex flex-wrap items-start justify-between gap-8 md:mb-14"
            style={cardEntranceStyle(challengesInView, 0, reducedMotion)}
          >
            <h2 className="max-w-md text-4xl font-semibold tracking-normal md:text-5xl">
              Challenges We Help Solve
            </h2>
            <p className="max-w-xs text-lg text-muted-foreground">
              Explore the strategic challenges TailoredIQ is built to solve, drawing on the
              experience of founders, CEOs, executives, and senior leaders across Africa.
            </p>
          </div>
        </div>

        {/* One fade-up for the whole block rather than the per-pill stagger
            this used to run: each pill now appears twice in its track, so a
            per-pill delay would have staggered the duplicates too and made
            the seam between the two copies visible on entry. */}
        <div
          ref={challengesRef}
          className="flex flex-col gap-5"
          style={cardEntranceStyle(challengesInView, 0, reducedMotion)}
        >
          {CHALLENGE_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="challenge-marquee">
              <div
                className="challenge-marquee-track"
                data-direction={rowIndex % 2 === 1 ? "reverse" : undefined}
                style={{ "--marquee-duration": `${row.durationSeconds}s` } as CSSProperties}
              >
                {/* The row rendered twice — the second copy is what the loop
                    lands on, and is hidden from assistive tech so the list
                    isn't announced double. */}
                {[...row.items, ...row.items].map((c, i) => {
                  const isClone = i >= row.items.length;
                  return (
                    <span
                      key={`${c.label}-${i}`}
                      data-marquee-clone={isClone ? "true" : undefined}
                      aria-hidden={isClone || undefined}
                      className="inline-flex shrink-0 cursor-default items-center gap-2.5 whitespace-nowrap rounded-full px-6 py-3.5 text-base font-medium text-mkt-text transition-[scale,filter,box-shadow] duration-200 ease-out hover:scale-[1.05] hover:shadow-[0_10px_24px_-8px_rgba(0,0,0,0.55)] hover:brightness-125 motion-reduce:hover:scale-100 md:text-lg"
                      style={{ background: c.bg }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/landing/challenges/tick-01.svg"
                        alt=""
                        className="h-5 w-5 shrink-0"
                      />
                      {c.label}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TRUSTED BY — logo marquee */}
      <section className="overflow-hidden bg-surface py-14">
        <div className="container-tight mb-8 text-center">
          <span className="eyebrow">Trusted by</span>
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

      {/* TESTIMONIALS — interactive filmstrip: 4 thumbnails, one expanded into
          a photo+quote panel at a time (click/keyboard to switch,
          auto-advances until the user picks one). */}
      <section
        id="testimonials"
        className="bg-mkt-sand py-24 scroll-mt-[calc(var(--nav-height)+2rem)] md:py-32"
      >
        <div className="container-tight">
          <div className="mx-auto mb-14 max-w-xl text-center">
            <h2 className="text-4xl font-semibold tracking-normal md:text-5xl">Testimonials</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Hear how founders, CEOs, executives, and senior leaders use TailoredIQ to make better
              decisions with greater confidence.
            </p>
          </div>

          <TestimonialsFilmstrip testimonials={TESTIMONIALS} defaultIndex={1} />
        </div>
      </section>

      <FounderNote />

      {/* CLOSING CTA — aspect-ratio (not padding) sizes this section, so it
          always reserves enough height for the full 7-row grid: the grid is
          absolutely positioned to fill its parent, so if the parent were only
          as tall as the text content, rows would overflow and the section's
          overflow-hidden would clip them.

          Tiles aren't pointer-events-none — the hole rows/cols the text sits
          in have no tiles at all, so there's no click-target conflict with
          the CTA button. */}
      <section className="relative overflow-hidden bg-mkt-panel">
        <div className="container-tight relative flex aspect-[1440/850] min-h-[520px] w-full items-center justify-center">
          <div
            ref={mosaicRef}
            className={`absolute inset-0 grid gap-3 p-6 ${mosaicInView ? "mosaic-in" : ""}`}
            style={{ gridTemplateColumns: `repeat(${MOSAIC_COLS}, 1fr)` }}
          >
            {MOSAIC_PATTERN.flatMap((row, r) =>
              [...row].map((ch, c) => {
                const cell = r * MOSAIC_COLS + c;
                if (ch === ".") return <div key={cell} />;
                const photo = MOSAIC_PLACEMENT.get(cell);
                const tileStyle = {
                  "--tile-delay": `${MOSAIC_ENTRANCE_DELAYS.get(cell) ?? 0}ms`,
                } as CSSProperties;
                if (photo) {
                  return (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={cell}
                      src={photo}
                      alt=""
                      className={`mosaic-tile mosaic-tile-photo aspect-[94/86] w-full rounded-2xl object-cover ${mosaicInView ? "mosaic-in" : ""}`}
                      style={tileStyle}
                    />
                  );
                }
                const shimmerIndex = MOSAIC_SHIMMER_CELLS.indexOf(cell);
                return (
                  <div
                    key={cell}
                    className={`mosaic-tile mosaic-tile-empty aspect-[94/86] w-full rounded-2xl ${mosaicInView ? "mosaic-in" : ""} ${shimmerIndex !== -1 ? "mosaic-tile-shimmer" : ""}`}
                    style={
                      shimmerIndex !== -1
                        ? { ...tileStyle, animationDelay: `${shimmerIndex * 4500}ms` }
                        : tileStyle
                    }
                  />
                );
              }),
            )}
          </div>
          <div
            className={`mosaic-text relative mx-auto w-full max-w-xl px-4 text-center ${mosaicInView ? "mosaic-in" : ""}`}
          >
            <h2 className="text-4xl font-semibold tracking-normal md:text-5xl">
              The best decisions are backed by experience.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Describe your challenge and receive a tailored Playbook inspired by leaders
              who&apos;ve faced similar decisions.
            </p>
            <div className="mt-6">
              <Link
                href={getStartedHref}
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-mkt-cta px-[14px] py-[12.5px] text-[18px] font-semibold text-mkt-cta-ink transition-colors hover:bg-mkt-cta/90"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
