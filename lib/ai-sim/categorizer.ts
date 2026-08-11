import type { Brief } from "@/lib/types";
import { CATEGORIES, CATEGORY_KEYWORDS, type Category } from "@/lib/constants/categories";

export interface CategoryScore {
  category: Category;
  score: number;
}

/** Keyword-scores arbitrary text against the category taxonomy, sorted desc. Includes zero-score entries so callers can detect "no signal yet". */
export function scoreCategories(text: string): CategoryScore[] {
  const lower = text.toLowerCase();
  return CATEGORIES.map((category) => {
    const keywords = CATEGORY_KEYWORDS[category];
    const score = keywords.reduce((sum, kw) => sum + (lower.includes(kw) ? 1 : 0), 0);
    return { category, score };
  }).sort((a, b) => b.score - a.score);
}

export function categorizeBrief(brief: Pick<Brief, "situation" | "objective" | "constraints" | "authority" | "existingActions" | "desiredOutcome">): {
  category: Category;
  secondaryCategories: Category[];
} {
  const text = [brief.situation, brief.objective, brief.constraints, brief.authority, brief.existingActions, brief.desiredOutcome].join(" ");

  const scores = scoreCategories(text);

  const [top, ...rest] = scores;
  const category = top.score > 0 ? top.category : "Strategy";
  const secondaryCategories = rest.filter((s) => s.score > 0).slice(0, 2).map((s) => s.category);

  return { category, secondaryCategories };
}
