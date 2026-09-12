"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/landing/reveal";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * "Share your expertise in ways that matter" — the four engagement types an
 * expert can take on, for the expert recruitment page.
 *
 * The panel pins to the viewport and scroll walks through the four: each step
 * brings its title forward and sinks the front photograph back into the deck,
 * so the four read as one stack of options rather than four separate offers.
 * Scroll position is the single source of truth — clicking a title scrolls to
 * that step rather than setting state directly, so the two can never disagree.
 *
 * Built from the page's existing vocabulary: `container-tight`, the `.eyebrow`
 * pill, the 48px section heading, and the same radii and `mkt-*` tokens as
 * every other section. Only the photography is new.
 */
const ENGAGEMENTS = [
  {
    title: "Contribute to Playbooks",
    body: "Strengthen AI-generated playbooks with your experience, practical insights, examples, and lessons from the field.",
    image: "/landing/engagements/playbooks.jpg",
    alt: "An operations executive annotating a printed strategy document beside an open laptop",
  },
  {
    title: "Expert Calls",
    body: "Talk directly with leaders facing challenges you've experienced and help them think through what to do next.",
    image: "/landing/engagements/calls.jpg",
    alt: "A senior advisor mid-sentence during a video consultation at his desk",
  },
  {
    title: "In-Person & Team Sessions",
    body: "Meet with clients or their teams when the challenge calls for deeper collaboration, workshops, or hands-on guidance.",
    image: "/landing/engagements/sessions.jpg",
    alt: "A business leader facilitating a working discussion with a small team around a meeting table",
  },
  {
    title: "Implementation Support",
    body: "Help clients put their playbooks into practice through ongoing advisory, hands-on support, or real-world execution.",
    image: "/landing/engagements/implementation.jpg",
    alt: "A consultant working through a delivery schedule on screen alongside two team members",
  },
] as const;

const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

/** Viewport-heights of scroll each step holds the pin for. Long enough to read
 *  the copy, short enough that four of them don't feel like a hijacked page. */
const STEP_SVH = 80;

/** Where a card sits once it is `depth` places behind the front of the deck.
 *  The deepest place is invisible, so the outgoing card reads as sinking back
 *  into the stack rather than vanishing off the front of it. */
const DECK_DEPTHS = [
  { y: 0, scale: 1, opacity: 1 },
  { y: 26, scale: 0.95, opacity: 1 },
  { y: 48, scale: 0.9, opacity: 0.55 },
  { y: 64, scale: 0.86, opacity: 0 },
];

export function ExpertEngagements() {
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Scroll drives the step. The listener is passive and coalesced into one
  // rAF, and only commits when the index actually changes, so scrolling past
  // the section costs a rect read per frame and nothing else.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) return;
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      const next = Math.min(ENGAGEMENTS.length - 1, Math.floor(progress * ENGAGEMENTS.length));
      setActive((current) => (current === next ? current : next));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  /** Clicks move the page, not the state — scroll stays the source of truth. */
  const goToStep = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - window.innerHeight;
    window.scrollTo({
      // A pixel past the step boundary, so the step that lands is the one asked
      // for rather than the one ending exactly there.
      top: top + (index / ENGAGEMENTS.length) * travel + 1,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  return (
    <section className="container-tight pt-24 md:pt-32">
      <Reveal className="mx-auto max-w-3xl text-center">
        <span className="eyebrow">Ways to engage</span>
        <h2 className="mt-4 text-balance text-[34px] font-semibold leading-[1.2] tracking-normal md:text-[48px]">
          Share your expertise in ways that matter
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Put your experience to work beyond a single conversation. Contribute to playbooks, advise
          clients directly, meet with teams when needed, and help turn strategy into action.
        </p>
      </Reveal>

      {/* The scroll track: one viewport to pin in, plus a step's worth of
          scroll for each engagement after the first. No transform on this or
          any ancestor — that would break the sticky child.
          The negative top margin absorbs the sticky box's own centring space,
          which would otherwise read as a hole between the heading and the
          panel before the pin takes hold. */}
      <div
        ref={trackRef}
        className="relative -mt-[12svh]"
        style={{ height: `calc(100svh + ${(ENGAGEMENTS.length - 1) * STEP_SVH}svh)` }}
      >
        <div className="sticky top-0 flex min-h-[100svh] items-center">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-20">
            {/* The deck. Sized from viewport height so it always fits the pin,
                and still clickable for anyone who reaches for it. */}
            <button
              type="button"
              onClick={() => goToStep((active + 1) % ENGAGEMENTS.length)}
              aria-label="Show the next way to engage"
              className="relative mx-auto w-full max-w-[420px]"
            >
              <div
                className="relative mx-auto aspect-[4/5] w-full"
                style={{ height: "min(52svh, 520px)", maxWidth: "100%" }}
              >
                {ENGAGEMENTS.map((item, i) => {
                  const depth = (i - active + ENGAGEMENTS.length) % ENGAGEMENTS.length;
                  const { y, scale, opacity } = DECK_DEPTHS[depth];
                  return (
                    <div
                      key={item.title}
                      aria-hidden={depth !== 0}
                      className="absolute inset-0 overflow-hidden rounded-2xl border border-mkt-hairline bg-mkt-panel shadow-[0_30px_70px_-30px_rgba(0,0,0,0.55)]"
                      style={{
                        transform: `translateY(${y}px) scale(${scale})`,
                        opacity,
                        zIndex: ENGAGEMENTS.length - depth,
                        transition: reduced
                          ? "opacity 200ms ease"
                          : `transform 420ms ${EASE_OUT}, opacity 320ms ${EASE_OUT}`,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={depth === 0 ? item.alt : ""}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    </div>
                  );
                })}
              </div>
            </button>

            {/* The four, as a list you read down. */}
            <ul className="flex flex-col">
              {ENGAGEMENTS.map((item, i) => {
                const isActive = i === active;
                return (
                  <li key={item.title}>
                    <button
                      type="button"
                      onClick={() => goToStep(i)}
                      aria-expanded={isActive}
                      className="w-full py-3 text-left md:py-4"
                    >
                      <h3
                        className={`text-[22px] font-semibold leading-[1.2] tracking-normal transition-colors duration-200 ease-out md:text-[32px] ${
                          isActive ? "text-mkt-text" : "text-mkt-text-mute hover:text-mkt-text-soft"
                        }`}
                      >
                        {item.title}
                      </h3>
                      <div
                        aria-hidden={!isActive}
                        className="grid"
                        style={{
                          gridTemplateRows: isActive ? "1fr" : "0fr",
                          opacity: isActive ? 1 : 0,
                          transition: reduced
                            ? "opacity 200ms ease"
                            : `grid-template-rows 280ms ${EASE_OUT}, opacity 240ms ${EASE_OUT}`,
                        }}
                      >
                        <p className="overflow-hidden text-[16px] leading-[1.55] text-mkt-text-soft [text-wrap:pretty] md:text-[17px]">
                          <span className="block max-w-[46ch] pt-3">{item.body}</span>
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
