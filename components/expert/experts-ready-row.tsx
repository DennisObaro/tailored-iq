"use client";

import Image from "next/image";
import { useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils/cn";

/**
 * The exact circular exports from the design file, not profiles read from the
 * API: this is a fixed piece of social proof under the composer rather than a
 * live view of whoever happens to be top-rated today. They're decorative —
 * the sentence beside them carries the meaning — so they stay out of the
 * accessibility tree.
 */
const FACES = [
  "/network/expert-1.png",
  "/network/expert-2.png",
  "/network/expert-3.png",
  "/network/expert-4.png",
];

/**
 * Hover spring. The hovered face lifts and grows; its neighbours lift too, by
 * FALLOFF^distance, so the row answers the cursor as one piece of fabric
 * rather than four independent buttons.
 *
 * Two curves, and which one is running is the whole character of the effect:
 * settling into a hover is a plain decelerate, while releasing overshoots
 * hard (the 3.85 control point) so the stack springs back past rest and
 * bounces down. Same module-scope-constant shape as the landing page's
 * EASE_OUT / EASE_OUT_BACK.
 */
const LIFT_PX = -4;
const SCALE = 1.05;
const FALLOFF = 0.45;
const DURATION_MS = 320;
const EASE_IN = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_OUT = "cubic-bezier(0.34, 3.85, 0.64, 1)";

export function ExpertsReadyRow({ className }: { className?: string }) {
  const [active, setActive] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();

  function faceStyle(i: number): React.CSSProperties | undefined {
    if (reducedMotion) return undefined;
    const shift = active === null ? 0 : LIFT_PX * FALLOFF ** Math.abs(i - active);
    const scale = i === active ? SCALE : 1;
    return {
      /* translateY before scale, so scale doesn't amplify the lift offset. */
      transform: `translateY(${shift.toFixed(3)}px) scale(${scale})`,
      /* Releasing springs; arriving doesn't. */
      transition: `transform ${DURATION_MS}ms ${active === null ? EASE_OUT : EASE_IN}`,
      /* Faces overlap in DOM order, so without this the lifted one would rise
         behind the faces that come after it. */
      zIndex: i === active ? 1 : undefined,
    };
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center" onMouseLeave={() => setActive(null)}>
        {FACES.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt=""
            width={32}
            height={32}
            onMouseEnter={() => setActive(i)}
            style={faceStyle(i)}
            /* Ring in the page colour, not a border: it sits outside the circle,
               so each face punches a clean hole out of the one behind it. */
            className={cn(
              "relative size-8 shrink-0 rounded-full ring-[1.5px] ring-gray-975",
              i > 0 && "-ml-3",
            )}
          />
        ))}
      </div>
      <p className="text-base font-medium text-gray-300">
        30+ experts available to share their experience.
      </p>
    </div>
  );
}
