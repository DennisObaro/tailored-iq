"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * "From Challenge to Clarity" — ported from the landing-page project's
 * components/HowItWorksScroller.tsx. Unchanged apart from asset paths now
 * being public/landing/ URLs (so `image`/`icon` are plain strings).
 */
export interface HowItWorksStep {
  number: string;
  icon: string;
  image: string;
  title: string;
  body: string;
}

function StepContent({ step, index }: { step: HowItWorksStep; index: number }) {
  return (
    <div className="container-tight w-full">
      <div
        className={`flex flex-col items-center gap-6 md:gap-[120px] ${
          index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={step.image}
          alt=""
          className="aspect-square w-full max-w-[480px] shrink-0 rounded-[24px] object-cover"
        />
        <div className="flex max-w-[396px] flex-col gap-2 md:gap-3">
          <span className="text-[16px] font-semibold text-mkt-text-mute md:text-[20px]">
            {step.number}
          </span>
          <h3 className="text-[22px] font-semibold leading-[1.3] tracking-normal text-mkt-text md:text-[32px] md:leading-[1.4]">
            {step.title}
          </h3>
          <p className="text-[15px] font-medium leading-[1.4] text-mkt-text-soft md:text-[20px]">
            {step.body}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Content-only fade-up, layered on top of StepContent without touching it —
 * so the text still gets a quiet entrance the *first* time its card covers
 * the viewport, rather than just appearing once the sticky covering brings
 * it into place.
 */
function useRevealOnce(threshold: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        io.disconnect();
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/**
 * Each step is its own position:sticky panel stacked in normal document
 * flow — no JS scroll math needed for "the next card covers the previous
 * one". As the user scrolls past a card's own slot, the next card (sticky at
 * the same top offset, later in the DOM so it paints over anything beneath
 * at the same stacking level) catches up and sticks in its place.
 *
 * Height is viewport-relative rather than the Figma-literal 694px: with card
 * height and sticky-trigger distance equal, one full cover cycle costs twice
 * the card height in scrolling — one card-height for the next card to slide
 * up, then an equal, visually static stretch before the one after it starts
 * moving. A shorter card shrinks both halves, so the sequence reads brisker
 * rather than stalling on each step.
 */
function StepCard({ step, index }: { step: HowItWorksStep; index: number }) {
  const { ref, visible } = useRevealOnce(0.5);
  return (
    <div
      ref={ref}
      className={`sticky flex h-[clamp(500px,68vh,640px)] w-full items-center overflow-hidden md:h-[clamp(440px,62vh,600px)] ${
        index === 0 ? "rounded-t-[40px]" : "rounded-t-[40px] border-t border-mkt-hairline"
      }`}
      style={{ top: "var(--nav-height)", backgroundColor: index % 2 === 0 ? "#111" : "#161616" }}
    >
      <div
        className={`w-full transition-[opacity,translate] duration-500 ease-out ${
          visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
        }`}
      >
        <StepContent step={step} index={index} />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={step.icon}
        alt=""
        className="absolute left-6 top-6 h-[30px] w-8 md:left-[104px] md:top-16"
      />
    </div>
  );
}

/**
 * prefers-reduced-motion fallback: plain stacked rows, no sticky covering —
 * that's a scroll-linked layering effect, closer in kind to parallax than to
 * a normal sticky header, so it's disabled alongside the page's other
 * autonomous motion. Each row fades in (opacity only, no drift).
 */
function FadeInRow({ step, index }: { step: HowItWorksStep; index: number }) {
  const { ref, visible } = useRevealOnce(0.2);
  return (
    <div
      ref={ref}
      className={`relative rounded-t-[40px] transition-opacity duration-700 ${
        index === 0 ? "" : "border-t border-mkt-hairline"
      } ${index % 2 === 0 ? "bg-mkt-panel" : "bg-mkt-panel-alt"} ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={step.icon}
        alt=""
        className="absolute left-6 top-6 h-[30px] w-8 md:left-[104px] md:top-16"
      />
      <div className="py-16 md:py-24">
        <StepContent step={step} index={index} />
      </div>
    </div>
  );
}

export function HowItWorksScroller({ steps }: { steps: HowItWorksStep[] }) {
  const reducedMotion = useReducedMotion();
  return (
    <div className="flex w-full flex-col">
      {steps.map((step, i) =>
        reducedMotion ? (
          <FadeInRow key={step.number} step={step} index={i} />
        ) : (
          <StepCard key={step.number} step={step} index={i} />
        ),
      )}
    </div>
  );
}
