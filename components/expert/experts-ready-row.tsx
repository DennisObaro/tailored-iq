import Image from "next/image";
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

export function ExpertsReadyRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center">
        {FACES.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt=""
            width={32}
            height={32}
            /* Ring in the page colour, not a border: it sits outside the circle,
               so each face punches a clean hole out of the one behind it. */
            className={cn("size-8 shrink-0 rounded-full ring-[1.5px] ring-gray-975", i > 0 && "-ml-3")}
          />
        ))}
      </div>
      <p className="text-base font-medium text-gray-300">
        30+ experts ready to share their experience.
      </p>
    </div>
  );
}
