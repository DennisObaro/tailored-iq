import { CATEGORIES, CATEGORY_KEYWORDS } from "@/lib/constants/categories";
import type { SuggestedExpertise } from "@/lib/types";

export function suggestExpertise(bio: string, currentRole: string, yearsExperience: number): SuggestedExpertise[] {
  const text = `${bio} ${currentRole}`.toLowerCase();

  const scored: SuggestedExpertise[] = [];
  for (const category of CATEGORIES) {
    const keywords = CATEGORY_KEYWORDS[category];
    const hits = keywords.filter((kw) => text.includes(kw)).length;
    if (hits === 0) continue;
    const confidence = Math.min(95, 55 + hits * 12 + Math.min(yearsExperience, 20));
    scored.push({ label: category, confidence });
  }

  scored.sort((a, b) => b.confidence - a.confidence);

  if (scored.length === 0) {
    return [{ label: "Strategy", confidence: 60 }];
  }
  return scored.slice(0, 4);
}
