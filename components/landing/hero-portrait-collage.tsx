"use client";

import { useCallback, useEffect, type CSSProperties, type RefObject } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/* ============================================================================
   TUNING — every number the effect reads lives here.
   ========================================================================= */

/**
 * `depth` runs 0 (furthest back) to 1 (nearest the viewer) and is the single
 * input for all five depth cues below. Everything else is derived, so moving
 * one portrait forward or back is a one-number edit in HERO_COLLAGE.
 */
const DEPTH = {
  /** Far portraits dim slightly, as if less light reaches them. Pushed a
   *  little further than it once was (0.88 -> 0.85) to take over some of the
   *  separation the depth-of-field blur used to provide — see
   *  MAX_DEPTH_BLUR_PX. Not pushed further than this: on a near-black
   *  backdrop, dimming a face much past ~0.8 stops reading as distance and
   *  starts reading as a washed-out image, which is the same complaint the
   *  blur caused. */
  opacityFar: 0.85,
  opacityNear: 1,
  /** Contact + ambient shadow pairs, interpolated between these two ends.
   *  Two layers rather than one: a tight dark contact shadow sells the object
   *  sitting *on* something, a broad soft one sells the distance to it.
   *
   *  The near end is deliberately heavier than it was, and the far end a
   *  touch lighter, widening the gap between them. With blur gone this is the
   *  cue doing the most work: a near portrait now casts a large, soft, dark
   *  shadow that reads as floating well clear of the page, while a far one is
   *  almost flush against it. */
  shadow: {
    farContact: { y: 2, blur: 6, spread: -2, alpha: 0.16 },
    nearContact: { y: 12, blur: 22, spread: -7, alpha: 0.55 },
    farAmbient: { y: 3, blur: 12, spread: -6, alpha: 0.1 },
    nearAmbient: { y: 32, blur: 64, spread: -14, alpha: 0.62 },
  },
} as const;

/** Depth-of-field blur applied to the furthest portraits, in px. Scales with
 *  (1 - depth), so this is the amount at depth 0 and it reaches 0 at depth 1.
 *
 *  Default 0 — fully sharp. These are faces at 143px wide, and at that size
 *  even ~1.5px of blur read as a low-resolution image rather than as
 *  distance, which is the opposite of premium. Depth is carried by translateZ,
 *  the perspective scale that falls out of it, the shadow ramp and the opacity
 *  dimming instead.
 *
 *  Nudge to ~0.5 for a bare hint of atmosphere on the back plane; past that
 *  the far faces start looking soft rather than far away. At exactly 0 no
 *  `filter` is emitted at all (see the tile below), which also keeps those
 *  layers off the rasterisation path entirely. */
const MAX_DEPTH_BLUR_PX = 0;

/* ---------------------------------------------------------------------------
   TRUE 3D
   The group is a real 3D rendering context: one `perspective` on the outer
   container, `preserve-3d` on every wrapper between it and the portraits, and
   a real translateZ per portrait. Apparent size, overlap order and parallax
   all fall out of that projection rather than being simulated separately.
   ------------------------------------------------------------------------ */

/** Viewer-to-screen distance for the whole group. Smaller = wider-angle lens:
 *  a steeper size falloff and more lateral drift as portraits recede. Larger =
 *  flatter and more telephoto. This is the main dial for how strong the whole
 *  effect reads. */
const PERSPECTIVE_PX = 1200;

/** Real Z displacement in px, mapped from each portrait's `depth`.
 *
 *  Apparent size is now purely a consequence of these: the projection scales an
 *  element by PERSPECTIVE / (PERSPECTIVE - z), so with the values below the
 *  group spans 1200/1400 = 0.857x at the back to 1200/1080 = 1.111x at the
 *  front. There is deliberately no scale multiplier anywhere any more —
 *  applying one on top would double-count the size change and, worse, would
 *  stay axis-aligned while the group rotates, which is exactly what made the
 *  old version read as a flat sheet turning. */
const Z_FAR_PX = -200;
const Z_NEAR_PX = 120;

/** Peak rotation of the *whole group* toward the cursor. Because the portraits
 *  hold real Z inside that rotation, near ones sweep a wide arc and far ones
 *  barely shift — true parallax, with no per-item translation needed. */
const GROUP_TILT_MAX_DEG = 5.5;

/** Weighty rather than snappy: low stiffness, high damping, no overshoot. */
const POINTER_SPRING = { stiffness: 90, damping: 26, mass: 0.9 } as const;

/** Ambient float, which runs regardless of the pointer. */
const FLOAT = {
  amplitudePx: 8,
  /** Phones get a shorter drift — the same 8px is proportionally much larger
   *  against a narrow viewport, and it competes with scrolling. */
  amplitudeMobilePx: 4,
  baseDurationSec: 6.4,
  /** Spread of durations across the set, so no two portraits share a period
   *  and the group never re-syncs into a single pulsing block. */
  durationSpreadSec: 2.6,
  staggerSec: 0.45,
} as const;

/* ============================================================================
   DATA
   ========================================================================= */

export interface HeroPortrait {
  src: string;
  /** 0 = furthest back, 1 = nearest. Drives scale, blur, opacity, shadow,
   *  z-index, parallax travel and tilt — see DEPTH above. */
  depth: number;
  /** This portrait's place in the hero's staggered page-load entrance. */
  delayMs: number;
}

interface HeroCollageColumn {
  /** Baseline offset producing the woven, alternating-height row. */
  offsetClass?: string;
  portraits: HeroPortrait[];
}

/**
 * Depth is assigned to reinforce the composition that already existed rather
 * than to cut across it. The row is built as a shallow arc: the centre column
 * sits nearest the viewer and depth falls away toward both edges, so the
 * parallax swings the middle of the group furthest and the outer framing
 * portraits barely move — the same read the vertical offsets already give.
 *
 * Within that, the columns the layout pushes *down* (mt-[98px], sitting lower
 * and closer to the headline) are nearer than the ones it lifts (mt-[38px]),
 * so depth agrees with the existing vertical rhythm instead of fighting it.
 */
const HERO_COLLAGE: HeroCollageColumn[] = [
  {
    portraits: [
      { src: "/landing/hero-collage-1.webp", depth: 0.12, delayMs: 150 },
      { src: "/landing/hero-collage-2.webp", depth: 0.26, delayMs: 230 },
    ],
  },
  {
    offsetClass: "mt-[98px]",
    portraits: [{ src: "/landing/hero-collage-3.webp", depth: 0.58, delayMs: 310 }],
  },
  {
    offsetClass: "mt-[38px]",
    portraits: [{ src: "/landing/hero-collage-4.webp", depth: 0.3, delayMs: 390 }],
  },
  {
    offsetClass: "mt-[98px]",
    portraits: [{ src: "/landing/hero-collage-5.webp", depth: 1, delayMs: 470 }],
  },
  {
    offsetClass: "mt-[38px]",
    portraits: [{ src: "/landing/hero-collage-6.webp", depth: 0.34, delayMs: 430 }],
  },
  {
    offsetClass: "mt-[98px]",
    portraits: [{ src: "/landing/hero-collage-7.webp", depth: 0.54, delayMs: 350 }],
  },
  {
    portraits: [
      { src: "/landing/hero-collage-8.webp", depth: 0.1, delayMs: 270 },
      { src: "/landing/hero-collage-9.webp", depth: 0.22, delayMs: 190 },
    ],
  },
];

/**
 * Flat left-to-right index per portrait, resolved once at module scope. The
 * float stagger is meant to sweep across the whole grid rather than restart in
 * each column, and deriving that during render would mean advancing a counter
 * mid-render — which is exactly the mutation the React Compiler forbids.
 */
const HERO_COLLAGE_COLUMNS = (() => {
  let flatIndex = 0;
  return HERO_COLLAGE.map((column) => ({
    offsetClass: column.offsetClass,
    portraits: column.portraits.map((portrait) => ({ ...portrait, index: flatIndex++ })),
  }));
})();

/* ============================================================================
   DERIVATION
   ========================================================================= */

const mix = (far: number, near: number, depth: number) => far + (near - far) * depth;

/** Layered contact + ambient shadow for a given depth.
 *
 *  The ink and an overall strength multiplier come from CSS custom properties
 *  so the light theme can soften both without this function knowing which
 *  theme is live — calc() does the scaling at paint time. */
function depthShadow(depth: number): string {
  const { farContact, nearContact, farAmbient, nearAmbient } = DEPTH.shadow;
  const contact = `0 ${mix(farContact.y, nearContact.y, depth).toFixed(1)}px ${mix(
    farContact.blur,
    nearContact.blur,
    depth,
  ).toFixed(1)}px ${mix(farContact.spread, nearContact.spread, depth).toFixed(1)}px rgba(var(--portrait-shadow-rgb, 0, 0, 0),calc(var(--portrait-shadow-scale, 1) * ${mix(
    farContact.alpha,
    nearContact.alpha,
    depth,
  ).toFixed(3)}))`;
  const ambient = `0 ${mix(farAmbient.y, nearAmbient.y, depth).toFixed(1)}px ${mix(
    farAmbient.blur,
    nearAmbient.blur,
    depth,
  ).toFixed(1)}px ${mix(farAmbient.spread, nearAmbient.spread, depth).toFixed(1)}px rgba(var(--portrait-shadow-rgb, 0, 0, 0),calc(var(--portrait-shadow-scale, 1) * ${mix(
    farAmbient.alpha,
    nearAmbient.alpha,
    depth,
  ).toFixed(3)}))`;
  return `${contact}, ${ambient}`;
}

/* ============================================================================
   COMPONENTS
   ========================================================================= */

function HeroPortraitTile({
  portrait,
  index,
  floatEnabled,
  floatAmplitude,
}: {
  portrait: HeroPortrait;
  index: number;
  floatEnabled: boolean;
  floatAmplitude: number;
}) {
  const { src, depth, delayMs } = portrait;

  /** Real depth along Z. Everything the eye reads as "size" now comes from
   *  the group's perspective projecting this, not from a scale factor. */
  const z = mix(Z_FAR_PX, Z_NEAR_PX, depth);
  // Max at the back plane, zero at the front. Zero everywhere while
  // MAX_DEPTH_BLUR_PX is 0, in which case no filter is emitted below.
  const blurPx = MAX_DEPTH_BLUR_PX * (1 - depth);

  // Desynced so the group never pulses as one block.
  const floatDuration =
    FLOAT.baseDurationSec + ((index * 0.37) % 1) * FLOAT.durationSpreadSec;

  return (
    // The 3D node. `z` sits in `style` while the float animates `y`, and
    // Framer composes both into a single transform (…translateY() translateZ()…)
    // every frame — so the drift rides on top of the depth instead of
    // replacing it, which is what a separate translateY wrapper would do.
    //
    // No pointer transform here at all: the group rotation above is what
    // produces parallax now, and it does so correctly because this element
    // holds real Z inside that rotation.
    <motion.div
      className="h-[168px] w-[143px] shrink-0"
      style={{ z }}
      animate={floatEnabled ? { y: [0, -floatAmplitude, 0] } : undefined}
      transition={
        floatEnabled
          ? {
              duration: floatDuration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * FLOAT.staggerSec,
            }
          : undefined
      }
    >
      {/* Everything below this line is deliberately OUTSIDE the 3D chain.
          `filter`, `opacity` below 1 and `overflow: hidden` each force an
          element to flatten its subtree, so any of them on an ancestor of the
          translateZ node would silently collapse the whole effect back to 2D.
          That is why the entrance animation (it animates opacity), the depth
          dimming, and the blur if it is ever turned back on all live here,
          under the 3D node rather than over it. The dimming alone is enough to
          make this nesting load-bearing even with blur at 0 — do not hoist it.
          Flattening at this level is harmless: nothing below needs Z. */}
      <div className="hero-anim-up h-full w-full" style={heroEntranceStyle(delayMs)}>
        <div
          className="h-full w-full"
          style={{
            // `none` rather than `blur(0px)`: any filter value — zero
            // included — creates a stacking context and forces the layer to
            // rasterise, which itself softens the image. With
            // MAX_DEPTH_BLUR_PX at 0 this branch keeps every portrait off that
            // path completely.
            filter: blurPx > 0.01 ? `blur(${blurPx.toFixed(2)}px)` : "none",
            opacity: mix(DEPTH.opacityFar, DEPTH.opacityNear, depth),
          }}
        >
          {/* Hover, unchanged: shadow and scale are split onto separate layers
              because box-shadow is a main-thread repaint property, and pairing
              it with a transform on one element made the hover visibly
              stutter. */}
          <div className="group relative h-full w-full">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[20px] opacity-0 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6)] transition-opacity duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100 motion-reduce:group-hover:opacity-0"
            />
            <div
              className="h-full w-full rounded-[20px] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
              style={{ boxShadow: depthShadow(depth) }}
            >
              <div className="h-full w-full overflow-hidden rounded-[20px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/** Inline custom properties the shared entrance keyframes read. */
function heroEntranceStyle(delayMs: number): CSSProperties {
  return {
    ["--hero-delay" as string]: `${delayMs}ms`,
    ["--hero-rise" as string]: "10px",
  } as CSSProperties;
}

/**
 * The hero's scattered portrait grid.
 *
 * Five depth cues (scale, shadow, blur, opacity, z-index) are static and
 * always applied — they are what the layout falls back to when every
 * animation is off. Three motion layers sit on top of that and each has its
 * own gate:
 *
 *   pointer parallax + tilt — pointer-driven, so `md` and up only
 *   ambient float           — always on, at a reduced amplitude on phones
 *
 * `prefers-reduced-motion` disables all three, leaving the static layering.
 *
 * @param parallaxSourceRef element the pointer is tracked across. Passing the
 *   whole hero section (rather than tracking only the grid itself) means the
 *   portraits respond as the cursor crosses the headline and CTA too, instead
 *   of snapping to life only once it enters the row.
 */
export function HeroPortraitCollage({
  parallaxSourceRef,
}: {
  parallaxSourceRef: RefObject<HTMLElement | null>;
}) {
  const reducedMotion = useReducedMotion();
  // Tailwind's `md`. Pointer effects cost a listener plus per-frame spring
  // work, and there is no pointer to speak of below this.
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const pointerEffectsEnabled = isDesktop && !reducedMotion;
  const floatEnabled = !reducedMotion;
  const floatAmplitude = isDesktop ? FLOAT.amplitudePx : FLOAT.amplitudeMobilePx;

  // Normalised -1..1 from the source element's centre.
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const pointerX = useSpring(rawX, POINTER_SPRING);
  const pointerY = useSpring(rawY, POINTER_SPRING);

  // One rotation for the entire group, rather than a tilt per card. Inside a
  // real perspective this is the whole parallax: portraits pushed forward on Z
  // sweep a wide arc as the group turns, ones pushed back barely move, and the
  // near ones correctly occlude the far ones on the way past. Rotating each
  // card on its own axis — the previous approach — could never produce that,
  // which is why it read as a flat sheet turning.
  const rotateY = useTransform(pointerX, (v) => v * GROUP_TILT_MAX_DEG);
  // Negated: pointer below centre should tip the group's top edge away, which
  // is a negative rotateX.
  const rotateX = useTransform(pointerY, (v) => -v * GROUP_TILT_MAX_DEG);

  const resetPointer = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  useEffect(() => {
    const el = parallaxSourceRef.current;
    if (!el || !pointerEffectsEnabled) {
      // Covers switching the effects off mid-session (a reduced-motion toggle,
      // or a resize below md) — without this the grid would keep whatever
      // offset it happened to hold at that moment.
      resetPointer();
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      rawX.set(((event.clientX - rect.left) / rect.width - 0.5) * 2);
      rawY.set(((event.clientY - rect.top) / rect.height - 0.5) * 2);
    };

    // `pointermove` rather than `mousemove` so a stylus drives it too, and
    // pointerleave so the grid eases home instead of holding its last offset.
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerleave", resetPointer);
    return () => {
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerleave", resetPointer);
      resetPointer();
    };
  }, [parallaxSourceRef, pointerEffectsEnabled, rawX, rawY, resetPointer]);

  return (
    // Outer: owns the single `perspective` for the whole group. perspective-origin
    // defaults to this box's centre, which is where the composition's nearest
    // portrait already sits, so the projection radiates out from the focal point
    // rather than from some arbitrary corner.
    <div
      className="mb-[48px] mt-2 hidden h-[266px] md:block"
      style={{ perspective: `${PERSPECTIVE_PX}px` }}
    >
      {/* The rotating group. preserve-3d here and on every column below is what
          keeps the portraits' translateZ meaningful — the default `flat` would
          project each child onto this plane and throw the depth away before the
          perspective ever saw it. */}
      <motion.div
        className="flex h-full items-start justify-center gap-[28px]"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        {HERO_COLLAGE_COLUMNS.map((column, columnIndex) => (
          <div
            key={columnIndex}
            className={`flex flex-col gap-[28px] ${column.offsetClass ?? ""}`}
            style={{ transformStyle: "preserve-3d" }}
          >
            {column.portraits.map((portrait) => (
              <HeroPortraitTile
                key={portrait.src}
                portrait={portrait}
                index={portrait.index}
                floatEnabled={floatEnabled}
                floatAmplitude={floatAmplitude}
              />
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
