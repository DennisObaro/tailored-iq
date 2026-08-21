"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Interactive testimonial filmstrip. Ported from the landing-page project's
 * components/TestimonialsFilmstrip.tsx; the only change is that the
 * `testimonial-fade` keyframes moved from an inline <style> tag into
 * globals.css, since a <style> element inside a component body re-emits on
 * every render here for no benefit.
 */
export interface Testimonial {
  photo: string;
  objectPosition: string;
  quote: string;
  name: string;
  title: string;
  /**
   * Framing correction for a source photo shot wider than the rest, so its
   * subject reads at the same scale as its neighbours in both layouts —
   * it corrects the photo, not the panel. See .testimonial-photo in
   * globals.css for why object-position can't do this job. Omit for photos
   * already cropped tightly.
   */
  zoom?: number;
  /** Percentage of panel height to nudge a zoomed photo onto the face. */
  shift?: string;
}

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const WIDTH_DURATION = 450;
const TEXT_DELAY = 100;
const TEXT_DURATION = 250;
const AUTO_ADVANCE_INTERVAL = 6500;
const RESUME_AFTER_INTERACTION = 4000;

/**
 * Shared fade-in for the quote/name blocks. Opacity only, no positional
 * movement — an earlier version slid the text in from whichever side of the
 * row the panel sat on, which read as distracting on every auto-advance.
 * Runs as a CSS animation rather than a mount + class-swap transition
 * because React mounts this block fresh each time `isExpanded` flips true,
 * so keyframes always play on mount without needing a second render.
 */
function fadeInStyle(extraDelay: number) {
  return {
    animation: `testimonial-fade ${TEXT_DURATION}ms ${EASE} ${TEXT_DELAY + extraDelay}ms both`,
  };
}

function DesktopFilmstrip({
  testimonials,
  defaultIndex,
  reducedMotion,
}: {
  testimonials: Testimonial[];
  defaultIndex: number;
  reducedMotion: boolean;
}) {
  const [expandedIndex, setExpandedIndex] = useState(defaultIndex);
  const hasInteractedRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const select = useCallback((index: number, isManual: boolean) => {
    setExpandedIndex(index);
    if (isManual) {
      hasInteractedRef.current = true;
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    }
  }, []);

  // Cycles every ~6.5s unless the user has ever manually clicked a thumbnail
  // (permanent opt-out) or is currently hovering/focusing the strip
  // (temporary pause, resumed a few seconds after they stop).
  useEffect(() => {
    if (reducedMotion || isPaused) return;
    const id = setInterval(() => {
      if (hasInteractedRef.current) return;
      setExpandedIndex((current) => (current + 1) % testimonials.length);
    }, AUTO_ADVANCE_INTERVAL);
    return () => clearInterval(id);
  }, [reducedMotion, isPaused, testimonials.length]);

  const handlePause = useCallback(() => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    setIsPaused(true);
  }, []);

  const handleResume = useCallback(() => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => setIsPaused(false), RESUME_AFTER_INTERACTION);
  }, []);

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  return (
    <div
      className="hidden h-[460px] gap-3 md:flex md:gap-5 lg:h-[520px]"
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onFocus={handlePause}
      onBlur={handleResume}
    >
      {testimonials.map((t, i) => {
        const isExpanded = i === expandedIndex;
        return (
          <div
            key={t.name}
            className="flex min-w-0 overflow-hidden rounded-[40px] bg-mkt-card"
            style={{
              flexGrow: isExpanded ? 2.7 : 1,
              flexBasis: 0,
              transition: reducedMotion ? "none" : `flex-grow ${WIDTH_DURATION}ms ${EASE}`,
            }}
          >
            <button
              type="button"
              onClick={() => select(i, true)}
              aria-expanded={isExpanded}
              aria-label={`Show testimonial from ${t.name}`}
              className="testimonial-photo-btn group relative h-full shrink-0 overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
              style={{
                width: isExpanded ? "38%" : "100%",
                transition: reducedMotion ? "none" : `width ${WIDTH_DURATION}ms ${EASE}`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t.photo}
                alt=""
                className="testimonial-photo h-full w-full object-cover"
                style={
                  {
                    objectPosition: t.objectPosition,
                    "--photo-zoom": t.zoom,
                    "--photo-shift": t.shift,
                  } as CSSProperties
                }
              />
            </button>

            {isExpanded && (
              <div className="flex min-w-0 flex-1 flex-col justify-between p-4 md:p-6">
                <p
                  className="text-[15px] font-medium leading-[1.4] text-mkt-text md:text-[20px]"
                  style={fadeInStyle(0)}
                >
                  {t.quote}
                </p>
                <div style={fadeInStyle(40)}>
                  <div className="text-[15px] font-semibold leading-[1.4] text-mkt-text md:text-[20px]">
                    {t.name}
                  </div>
                  <div className="mt-1 text-[12px] leading-[1.4] text-mkt-text-soft md:text-[14px]">
                    {t.title}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MobileCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const ratios = new Map<number, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = cardRefs.current.indexOf(entry.target as HTMLDivElement);
          if (idx === -1) continue;
          ratios.set(idx, entry.intersectionRatio);
        }
        let best = 0;
        let bestRatio = 0;
        ratios.forEach((ratio, idx) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = idx;
          }
        });
        setActiveIndex(best);
      },
      { root, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    cardRefs.current.forEach((card) => card && io.observe(card));
    return () => io.disconnect();
  }, [testimonials.length]);

  const scrollToCard = useCallback((index: number) => {
    cardRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, []);

  return (
    <div className="md:hidden">
      <div
        ref={scrollRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2"
      >
        {testimonials.map((t, i) => (
          <div
            key={t.name}
            ref={(node) => {
              cardRefs.current[i] = node;
            }}
            className="flex w-[82%] shrink-0 snap-center flex-col overflow-hidden rounded-[32px] bg-mkt-card"
          >
            <div className="aspect-[4/5] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t.photo}
                alt=""
                className="testimonial-photo h-full w-full object-cover"
                style={
                  {
                    objectPosition: t.objectPosition,
                    "--photo-zoom": t.zoom,
                    "--photo-shift": t.shift,
                  } as CSSProperties
                }
              />
            </div>
            <div className="flex flex-col gap-3 p-5">
              <p className="text-[15px] font-medium leading-[1.4] text-mkt-text">{t.quote}</p>
              <div>
                <div className="text-[15px] font-semibold leading-[1.4] text-mkt-text">{t.name}</div>
                <div className="mt-1 text-[12px] leading-[1.4] text-mkt-text-soft">{t.title}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-2">
        {testimonials.map((t, i) => (
          <button
            key={t.name}
            type="button"
            onClick={() => scrollToCard(i)}
            aria-label={`Show testimonial from ${t.name}`}
            aria-current={i === activeIndex ? "true" : undefined}
            className="rounded-full p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                i === activeIndex ? "h-1.5 w-6 bg-gold" : "h-1.5 w-1.5 bg-[#4c4c4c]"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function TestimonialsFilmstrip({
  testimonials,
  defaultIndex = 1,
}: {
  testimonials: Testimonial[];
  defaultIndex?: number;
}) {
  const reducedMotion = useReducedMotion();

  // Two fully separate layouts, not one scaled down: below md, four
  // side-by-side panels (one ~2.7x wider) has no readable arrangement, so
  // mobile gets its own swipeable snap carousel. Both render together and
  // CSS picks which is visible, so there's no post-hydration layout flash.
  return (
    <>
      <DesktopFilmstrip
        testimonials={testimonials}
        defaultIndex={defaultIndex}
        reducedMotion={reducedMotion}
      />
      <MobileCarousel testimonials={testimonials} />
    </>
  );
}
