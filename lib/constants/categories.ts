export const CATEGORIES = [
  "Strategy",
  "Leadership",
  "People & Culture",
  "Operations",
  "Finance & Capital",
  "Market Expansion",
  "Digital & AI",
  "Governance",
  "Partnerships",
  "Talent",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  Strategy: ["strategy", "strategic", "direction", "vision", "priorities", "roadmap", "decision"],
  Leadership: ["leadership", "leader", "manage", "management trainee", "executive", "leading"],
  "People & Culture": ["culture", "engagement", "morale", "people", "dei", "wellbeing", "team dynamics"],
  Operations: ["operations", "process", "efficiency", "supply chain", "logistics", "scaling operations"],
  "Finance & Capital": ["finance", "funding", "capital", "budget", "cash flow", "investment", "fundraising"],
  "Market Expansion": ["market", "expansion", "new market", "geography", "international", "launch"],
  "Digital & AI": ["digital", "ai", "automation", "technology", "software", "data", "transformation"],
  Governance: ["governance", "board", "compliance", "risk", "policy", "regulatory"],
  Partnerships: ["partnership", "alliance", "vendor", "collaboration", "joint venture"],
  Talent: ["hiring", "retention", "talent", "recruiting", "onboarding", "professional development", "trainee"],
};

export const INDUSTRIES = [
  "Technology",
  "Construction",
  "Oil & Gas",
  "Pharmaceuticals",
  "Financial Services",
  "Retail",
  "Manufacturing",
  "Healthcare",
  "Professional Services",
  "Media & Entertainment",
];

export const FUNCTIONS = [
  "HR",
  "Finance",
  "Operations",
  "Strategy",
  "Marketing",
  "Leadership",
  "Product",
  "Sales",
  "Technology",
];

export const SENIORITIES = [
  "Founder / CEO",
  "Executive",
  "Senior Leader",
  "Senior Manager",
  "Line Manager",
  "Team Lead",
  "Individual Contributor",
];
