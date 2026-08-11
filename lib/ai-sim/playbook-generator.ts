import type { Brief, Report, Consultation, ExpertContribution, Playbook } from "@/lib/types";

const TITLE_BY_CATEGORY: Record<string, string> = {
  Talent: "Talent Retention Playbook",
  Leadership: "Leadership Development Playbook",
  "People & Culture": "Culture & Engagement Playbook",
  Operations: "Operational Scaling Playbook",
  "Finance & Capital": "Capital Readiness Playbook",
  "Market Expansion": "Market Expansion Playbook",
  "Digital & AI": "Digital Transformation Playbook",
  Governance: "Governance Readiness Playbook",
  Partnerships: "Partnerships Playbook",
  Strategy: "Strategic Growth Playbook",
};

export function generatePlaybook(
  brief: Brief,
  report: Report,
  consultation: Consultation | null,
  contributions: ExpertContribution[],
): Omit<Playbook, "id" | "projectId" | "createdAt" | "updatedAt" | "expertContributionIds"> {
  const title = TITLE_BY_CATEGORY[report.category] ?? "Strategic Growth Playbook";

  const keyInsights = [
    ...report.keyConsiderations.slice(0, 2),
    ...(consultation?.extractedInsights ?? []),
  ];

  const actionItems = report.strategicDirections.map((direction, i) => ({
    id: `action_${i}`,
    title: direction,
    description: direction,
    owner: "client" as const,
    timeframe: i === 0 ? "Next 2 weeks" : i === 1 ? "Next 4-6 weeks" : "Next quarter",
    status: "not_started" as const,
  }));

  const sections = consultation
    ? [
        {
          heading: "Expert input",
          body: consultation.extractedInsights?.join(" ") ?? "",
        },
      ]
    : [];

  if (contributions.length > 0) {
    sections.push({
      heading: "Additional expert contribution",
      body: contributions.map((c) => c.content).join(" "),
    });
  }

  return {
    title,
    status: "ready",
    version: 1,
    executiveSummary: report.problemSummary,
    keyInsights,
    recommendedStrategy: report.strategicDirections[0] ?? "",
    actionItems,
    frameworks: report.frameworks,
    risks: report.risks,
    successMeasures: [`Progress against: ${brief.desiredOutcome}`],
    resources: report.resources,
    sections,
  };
}
