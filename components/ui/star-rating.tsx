"use client";

import { Star, StarFilled } from "@/components/icons";

export function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} type="button">
          {n <= value ? <StarFilled className="size-5 text-gold" /> : <Star className="size-5 text-gray-700" />}
        </button>
      ))}
    </div>
  );
}
