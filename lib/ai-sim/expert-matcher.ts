import type { ExpertProfile } from "@/lib/types";
import { HELP_AREAS, helpAreaLabel } from "@/lib/constants/expert";

export interface ExpertMatch {
  expert: ExpertProfile;
  score: number;
  /** Why this expert, in the expert's own terms — shown on the opportunity. */
  reason: string;
}

/**
 * Matching is evidence-weighted (spec RULE 5): what the expert has
 * actually done for leaders (help areas) counts for more than a category
 * tag, which in turn counts for more than a rating. Only approved experts
 * are ever matchable.
 */
export function scoreExperts(
  experts: ExpertProfile[],
  category: string,
  industries: string[],
  challengeText = "",
): ExpertMatch[] {
  const haystack = challengeText.toLowerCase();

  return experts
    .filter((e) => e.verificationStatus === "approved")
    .map((expert) => {
      let score = 0;
      const reasons: string[] = [];

      const matchingHelpAreas = expert.helpAreas.filter((areaId) => {
        const area = HELP_AREAS.find((a) => a.id === areaId);
        if (!area) return false;
        return area.category === category || (haystack && haystack.includes(area.label.toLowerCase()));
      });
      if (matchingHelpAreas.length > 0) {
        score += 4 + matchingHelpAreas.length;
        reasons.push(
          `you've helped leaders with ${matchingHelpAreas.slice(0, 2).map(helpAreaLabel).join(" and ").toLowerCase()}`,
        );
      }

      if (expert.expertiseTags.includes(category)) {
        score += 3;
        reasons.push(`your experience in ${category.toLowerCase()}`);
      }

      const sharedIndustries = expert.industries.filter((i) => industries.includes(i));
      if (sharedIndustries.length > 0) {
        score += 2;
        reasons.push(`your background in ${sharedIndustries[0].toLowerCase()}`);
      }

      if (expert.yearsExperience >= 15) score += 0.5;
      score += expert.rating / 5;

      return {
        expert,
        score,
        reason: reasons.length
          ? `This matches ${reasons.slice(0, 2).join(", and ")}.`
          : `Your background lines up with this ${category.toLowerCase()} challenge.`,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function matchExperts(
  experts: ExpertProfile[],
  category: string,
  industries: string[],
  limit = 3,
): ExpertProfile[] {
  return scoreExperts(experts, category, industries)
    .slice(0, limit)
    .map((m) => m.expert);
}
