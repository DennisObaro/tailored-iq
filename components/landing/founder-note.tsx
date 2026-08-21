"use client";

import type { CSSProperties } from "react";
import { useInViewOnce } from "@/hooks/use-in-view-once";

/**
 * The founder's pinned note. Ported from the landing-page project's
 * components/FounderNote.tsx; only the asset paths changed (bundler imports
 * -> public/landing/).
 *
 * The torn-paper background is the designer's own SVG path rather than a CSS
 * approximation, and the pushpin is a flattened export of a 60+ layer
 * illustration. The card is scaled to ~70% of the Figma spec (804px -> 600px
 * wide, type/padding/photo scaled with it) so the proportions read like the
 * design — full-width bold type, not the thin look of shrinking only the
 * font sizes — without the note dominating the page.
 *
 * Entrance (see .founder-note-* in globals.css): scroll-triggered once, the
 * note physically arriving — paper drops and settles, pin lands ~150ms later
 * with a brief nudge to the paper's tilt, then the text fades in. No idle
 * sway after settling: with body copy in the card, a permanent slow rotation
 * reads as "why is this text moving" rather than as a physical detail.
 *
 * overflow-x-hidden is here rather than on html/body (a global rule breaks
 * the sticky nav, which lives in a separate part of the tree) because the
 * card's permanent -1deg rest tilt makes its rotated bounding box a few px
 * wider than its unrotated width — enough to produce a real horizontal
 * scrollbar on narrow viewports.
 */
export function FounderNote() {
  const { ref: founderNoteRef, inView: founderNoteInView } = useInViewOnce<HTMLDivElement>({
    threshold: 0.3,
  });

  return (
    <section className="container-tight overflow-x-hidden py-24 md:py-32">
      <div
        ref={founderNoteRef}
        className={`founder-note-drop-wrapper mx-auto max-w-[600px] ${
          founderNoteInView ? "founder-note-in" : ""
        }`}
      >
        <div
          className={`founder-note-rotate-wrapper relative p-10 md:p-14 ${
            founderNoteInView ? "founder-note-in" : ""
          }`}
          style={{
            backgroundImage: "url(/landing/founder-note/paper-bg.svg)",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            transformOrigin: "50% -14px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing/founder-note/pin.png"
            alt=""
            className={`founder-note-pin absolute -top-3.5 left-1/2 h-auto w-7 drop-shadow-lg md:w-8 ${
              founderNoteInView ? "founder-note-in" : ""
            }`}
          />
          <span
            className={`founder-note-text text-xs uppercase tracking-[3px] text-white/50 md:text-sm ${
              founderNoteInView ? "founder-note-in" : ""
            }`}
            style={{ "--text-stagger": "0ms" } as CSSProperties}
          >
            A note from our founder
          </span>
          <h3
            className={`founder-note-text mt-5 text-[26px] font-medium leading-tight tracking-tight text-white md:text-[28px] ${
              founderNoteInView ? "founder-note-in" : ""
            }`}
            style={{ "--text-stagger": "60ms" } as CSSProperties}
          >
            {/* The line break is pinned to the comma rather than left to the
                browser, which otherwise breaks mid-clause at this column
                width. Two mechanisms, because one alone isn't enough: the
                <br /> puts the break after the comma, and md:whitespace-nowrap
                stops the clause wrapping before it.

                nowrap is safe to guarantee from `md` up and only there — the
                card is a flat 600px at every width past that breakpoint, so
                the clause either fits or doesn't deterministically (28px is
                what makes it fit, down from 32px). Below `md` the card
                narrows with the viewport and the clause cannot fit on one
                line at any readable heading size, so it is left free to wrap
                rather than forced to overflow. */}
            <span className="md:whitespace-nowrap">When experience can be leveraged,</span>
            <br />
            it is a form of capital.
          </h3>
          <p
            className={`founder-note-text mt-5 text-justify hyphens-auto text-base leading-relaxed text-muted-foreground md:text-lg ${
              founderNoteInView ? "founder-note-in" : ""
            }`}
            style={{ "--text-stagger": "120ms" } as CSSProperties}
          >
            Working closely with organisations and leadership teams across African markets, one
            pattern became clear: when leaders face important decisions, what they need most is not
            another report or framework, but the perspective of someone who has walked the path, or
            similar, before... someone with relatable experience and lessons. TailoredIQ was created
            to bridge that gap. By connecting users with experienced professionals who understand
            both the opportunities and complexities of African markets, we help leaders move forward
            with greater clarity, confidence, and context.
          </p>
          <div
            className={`founder-note-text mt-10 flex items-center justify-between gap-4 ${
              founderNoteInView ? "founder-note-in" : ""
            }`}
            style={{ "--text-stagger": "180ms" } as CSSProperties}
          >
            <div>
              <div className="font-signature text-4xl text-gold md:text-5xl">Elizabeth Okonji</div>
              <div className="mt-1.5 text-sm uppercase tracking-widest text-muted-foreground md:text-base">
                Founder
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/founder-elizabeth.jpg"
              alt="Elizabeth Okonji, Founder of TailoredIQ"
              width={96}
              height={96}
              loading="lazy"
              className="h-20 w-20 shrink-0 rounded-full border-2 border-gold/40 object-cover md:h-24 md:w-24"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
