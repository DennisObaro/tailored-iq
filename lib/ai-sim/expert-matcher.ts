import type { ExpertProfile } from "@/lib/types";

export function matchExperts(
  experts: ExpertProfile[],
  category: string,
  industries: string[],
  limit = 3,
): ExpertProfile[] {
  const scored = experts
    .filter((e) => e.verificationStatus === "approved")
    .map((expert) => {
      let score = 0;
      if (expert.expertiseTags.includes(category)) score += 3;
      if (expert.industries.some((i) => industries.includes(i))) score += 2;
      score += expert.rating / 5;
      return { expert, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.expert);
}
