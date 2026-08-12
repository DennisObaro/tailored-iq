"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";
import { TESTIMONIALS } from "@/lib/constants/testimonials";

const AUTO_ADVANCE_MS = 5000;
const SLOT_WIDTH = 452;
const SIDE_SCALE = 0.88;

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Signed distance from `index`, wrapped to the shortest direction around the loop. */
function relativePosition(i: number, index: number, length: number) {
  let rel = i - index;
  if (rel > length / 2) rel -= length;
  if (rel < -length / 2) rel += length;
  return rel;
}

export function TestimonialCarousel() {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();
  const length = TESTIMONIALS.length;
  const paused = hovered || focused || reducedMotion;
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setInterval(() => {
      if (pausedRef.current) return;
      setIndex((i) => (i + 1) % length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [length, reducedMotion]);

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center gap-6"
      role="region"
      aria-roledescription="carousel"
      aria-label="Client testimonials"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <div className="relative h-[340px] w-full overflow-hidden">
        {TESTIMONIALS.map((testimonial, i) => {
          const rel = relativePosition(i, index, length);
          const isCenter = rel === 0;
          const isAdjacent = Math.abs(rel) === 1;
          const visible = reducedMotion ? isCenter : isCenter || isAdjacent;

          const transform = `translateX(calc(-50% + ${rel * SLOT_WIDTH}px)) scale(${isCenter ? 1 : SIDE_SCALE})`;

          return (
            <div
              key={testimonial.id}
              aria-hidden={!isCenter}
              className={cn(
                "absolute left-1/2 top-1/2 w-[420px] -translate-y-1/2 rounded-2xl border border-gray-900 bg-gray-900 p-10",
                !reducedMotion && "transition-[transform,opacity] duration-500 ease-out",
                visible ? "opacity-100" : "opacity-0",
                isCenter ? "z-10 pointer-events-auto" : "z-0 pointer-events-none",
              )}
              style={{ transform }}
            >
              <p className="text-lg leading-relaxed text-gray-100">{testimonial.quote}</p>
              <div className="mt-6 flex items-center gap-3">
                <Avatar firstName={testimonial.name.split(" ")[0]} lastName={testimonial.name.split(" ")[1] ?? ""} size="md" />
                <div>
                  <p className="text-sm font-semibold text-gray-50">{testimonial.name}</p>
                  <p className="text-xs text-gray-400">{testimonial.role}</p>
                </div>
              </div>
              {!isCenter && (
                <div
                  className={cn(
                    "absolute inset-0 rounded-2xl bg-gray-975/70",
                    !reducedMotion && "transition-opacity duration-500 ease-out",
                  )}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {TESTIMONIALS.map((testimonial, i) => (
          <button
            key={testimonial.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to testimonial from ${testimonial.name}`}
            aria-current={i === index}
            className={cn(
              "size-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-975",
              i === index ? "bg-primary-500" : "bg-gray-700 hover:bg-gray-600",
            )}
          />
        ))}
      </div>
    </div>
  );
}
