import { CATEGORIES, CATEGORY_KEYWORDS, FUNCTIONS, INDUSTRIES, SENIORITIES } from "@/lib/constants/categories";

export interface ParsedCv {
  /** Text we can quote back as supporting evidence for an expertise claim. */
  excerpt: string;
  currentRole?: string;
  organisation?: string;
  industries: string[];
  functions: string[];
  markets: string[];
  seniority?: string;
  yearsExperience?: number;
  /** Categories the CV text actually supports — the evidence check runs against this. */
  supportedCategories: string[];
}

const MARKETS = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "Egypt", "Angola", "Benin",
  "United Kingdom", "Ireland", "Germany", "France", "Italy", "Spain", "Poland",
  "Switzerland", "United Arab Emirates", "Saudi Arabia", "India", "Singapore",
  "United States", "Canada", "Brazil", "Australia",
];

const SENIORITY_HINTS: [string, string][] = [
  ["founder", "Founder / CEO"],
  ["chief executive", "Founder / CEO"],
  ["ceo", "Founder / CEO"],
  ["chief", "Executive"],
  ["c-suite", "Executive"],
  ["vp ", "Executive"],
  ["vice president", "Executive"],
  ["director", "Senior Leader"],
  ["head of", "Senior Leader"],
  ["senior manager", "Senior Manager"],
  ["manager", "Line Manager"],
  ["lead", "Team Lead"],
];

/**
 * Stands in for CV parsing. A real implementation would run the uploaded
 * document through an extraction service; this reads whatever text we have
 * (pasted CV content, a filename, the bio the expert already wrote) and
 * pulls out the same fields, so the calling code and the UI around it are
 * exactly what a real parser would need.
 */
export function parseCv(text: string): ParsedCv {
  const haystack = text.toLowerCase();

  const industries = INDUSTRIES.filter((i) => haystack.includes(i.toLowerCase()));
  const functions = FUNCTIONS.filter((f) => haystack.includes(f.toLowerCase()));
  const markets = MARKETS.filter((m) => haystack.includes(m.toLowerCase()));

  const supportedCategories = CATEGORIES.filter((category) =>
    CATEGORY_KEYWORDS[category].some((kw) => haystack.includes(kw)),
  );

  const seniority = SENIORITY_HINTS.find(([hint]) => haystack.includes(hint))?.[1];

  // "18 years", "18+ years", "since 2008"
  const yearsMatch = haystack.match(/(\d{1,2})\s*\+?\s*years?/);
  const sinceMatch = haystack.match(/since\s+(19|20)(\d{2})/);
  const yearsExperience = yearsMatch
    ? Number(yearsMatch[1])
    : sinceMatch
      ? new Date().getFullYear() - Number(`${sinceMatch[1]}${sinceMatch[2]}`)
      : undefined;

  /**
   * "Head of Operations at Delta Energy" / "CFO, Kite Payments". The
   * organisation group stops at sentence punctuation so a CV that runs
   * straight on ("...at Harbour Logistics. 16 years across...") doesn't
   * swallow the next sentence into the company name.
   */
  const roleMatch = text.match(/([A-Z][A-Za-z&/ ]{2,40}?)\s+(?:at|,)\s+([A-Z][A-Za-z0-9&' ]{2,40}?)(?=[.,;:\n(]|$)/);

  const excerpt = text.trim().slice(0, 400);

  return {
    excerpt,
    currentRole: roleMatch?.[1]?.trim(),
    organisation: roleMatch?.[2]?.trim(),
    industries,
    functions,
    markets,
    seniority: seniority ?? SENIORITIES[2],
    yearsExperience,
    supportedCategories,
  };
}
