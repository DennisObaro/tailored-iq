"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Play } from "@/components/icons";
import { useInViewOnce } from "@/hooks/use-in-view-once";

/**
 * The founder's note. Ported from a Figma redesign
 * (node 362:149) that replaced the original torn-paper-and-pushpin card with
 * a two-panel layout: copy on one side, a video of the founder on the other.
 *
 * The video panel is click-to-play rather than autoplay — the Figma frame is
 * a static still with no visible controls, so autoplay-vs-click-to-play
 * isn't answerable from the design alone; click-to-play with native controls
 * was the explicit call here. Starts on a poster frame (a clean mid-video
 * frame, not frame 0 — the source has a name/logo lower-third caption that
 * only appears in the first ~9s) with a custom play button matching the
 * design's aesthetic instead of the browser-default one, then hands off to
 * native `controls` once playing so scrub/pause/volume work normally.
 */
export function FounderNote() {
  const { ref: founderNoteRef, inView: founderNoteInView } = useInViewOnce<HTMLDivElement>({
    threshold: 0.2,
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    setPlaying(true);
    videoRef.current?.play();
  };

  return (
    <section ref={founderNoteRef} className="container-tight py-8 md:py-32">
      <div className="mx-auto flex max-w-[1234px] flex-col overflow-hidden rounded-[40px] bg-gray-950 md:flex-row md:items-stretch">
        {/* COPY */}
        <div
          className={`founder-note-panel flex flex-col justify-center gap-10 rounded-t-[40px] px-8 py-12 sm:px-12 md:w-[55%] md:rounded-l-[40px] md:rounded-tr-none md:px-14 md:py-16 lg:px-16 ${
            founderNoteInView ? "founder-note-in" : ""
          }`}
          style={{ "--panel-delay": "0ms" } as CSSProperties}
        >
          <div className="flex flex-col gap-5">
            <span className="text-sm uppercase tracking-[3px] text-white/50 md:text-base">
              A note from our founder
            </span>
            <h3 className="text-[26px] font-medium leading-[1.4] tracking-tight text-white md:text-[36px] lg:text-[40px]">
              When experience can be leveraged, it is a form of capital.
            </h3>
            <p className="text-base leading-[1.8] text-mkt-text-soft md:text-lg lg:text-[22px]">
              Working closely with organisations and leadership teams across African markets, one
              pattern became clear: when leaders face important decisions, what they need most is
              not another report or framework, but the perspective of someone who has walked the
              path, or similar, before... someone with relatable experience and lessons. TailoredIQ
              was created to bridge that gap. By connecting users with experienced professionals who
              understand both the opportunities and complexities of African markets, we help leaders
              move forward with greater clarity, confidence, and context.
            </p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="font-signature text-4xl leading-none text-gold md:text-5xl">
                Elizabeth Okonji
              </div>
              <div className="text-base text-mkt-text-mute md:text-lg">Founder</div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/founder-elizabeth.jpg"
              alt="Elizabeth Okonji, Founder of TailoredIQ"
              width={84}
              height={84}
              loading="lazy"
              className="h-16 w-16 shrink-0 rounded-full object-cover md:h-[84px] md:w-[84px]"
            />
          </div>
        </div>

        {/* VIDEO */}
        <div
          className={`founder-note-panel relative aspect-[4/5] shrink-0 overflow-hidden rounded-b-[40px] md:aspect-auto md:w-[45%] md:rounded-r-[40px] md:rounded-bl-none ${
            founderNoteInView ? "founder-note-in" : ""
          }`}
          style={{ "--panel-delay": "120ms" } as CSSProperties}
        >
          <video
            ref={videoRef}
            src="/landing/founder-note/video.mp4"
            poster="/landing/founder-note/poster.jpg"
            controls={playing}
            playsInline
            preload="none"
            onEnded={() => setPlaying(false)}
            className="absolute inset-0 h-full w-full object-cover object-[70%_50%]"
          />
          {!playing && (
            <button
              type="button"
              onClick={play}
              aria-label="Play video: a note from Elizabeth Okonji"
              className="group absolute inset-0 flex items-center justify-center bg-black/10 transition-colors hover:bg-black/25"
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur transition-transform duration-200 group-hover:scale-110 md:size-20">
                <Play className="ml-1 size-6 text-gray-975 md:size-7" aria-hidden />
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
