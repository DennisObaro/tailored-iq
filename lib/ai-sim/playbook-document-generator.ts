import type { Brief, PlaybookBlockBody, Report } from "@/lib/types";

/**
 * A section before it has ids — the generator's output shape. Blocks come out
 * as bodies without identity: the generator describes content, and whoever
 * persists it stamps the ids, so a block's id is minted exactly once at the
 * point it starts existing rather than being regenerated on every draft.
 */
export interface GeneratedSection {
  title: string;
  blocks: PlaybookBlockBody[];
  children?: GeneratedSection[];
}

/**
 * A named framework and the person behind it, so "The Science" cites
 * something real rather than gesturing at research. Chosen by challenge
 * category; the fallback is deliberately generic rather than wrong.
 */
const FRAMEWORKS: Record<string, { framework: string; text: string }[]> = {
  "Market Expansion": [
    {
      framework: "Pankaj Ghemawat's CAGE Distance Framework",
      text: "It examines Cultural, Administrative, Geographic and Economic distance between markets, giving a disciplined way to compare entry options instead of treating a region as a single market.",
    },
    {
      framework: "The Uppsala internationalisation model (Johanson and Vahlne)",
      text: "It explains why firms reduce uncertainty through incremental market commitments and learning. A limited pilot lets you learn about distribution before a larger, harder-to-reverse commitment.",
    },
  ],
  Leadership: [
    {
      framework: "Ichak Adizes' corporate lifecycle work",
      text: "It describes how the capabilities a leadership team needs change as an organisation grows, which is why a team that worked at one size can stall at the next without anyone becoming worse at their job.",
    },
    {
      framework: "Amy Edmondson's research on psychological safety",
      text: "Teams that surface problems early outperform teams that look harmonious. Shared decision rights matter more than shared social experiences for building that candour.",
    },
  ],
  Talent: [
    {
      framework: "Daniel Pink's autonomy, mastery and purpose",
      text: "Development that people author themselves outperforms development assigned to them, because ownership is what converts a plan into behaviour.",
    },
  ],
};

function frameworksFor(category: string) {
  return FRAMEWORKS[category] ?? [
    {
      framework: "Kurt Lewin's model of planned change",
      text: "Change holds when the conditions that produced the old behaviour are altered, not when the new behaviour is merely announced. Structure has to move before habits will.",
    },
  ];
}

/**
 * Builds the baseline document from what TailoredIQ already knows: the
 * client's confirmed brief and the curated executive summary.
 *
 * The shape follows the canonical sample playbook — introduction, problem
 * statement, then solution pillars that each run insight → evidence → phased
 * steps, followed by the execution apparatus (checklist, roadmap, decision
 * matrix, metrics, risks, resources). Which pillars exist depends on the
 * challenge; the skeleton does not.
 *
 * This is the "bare bones" draft, deliberately. It states the structure and
 * the reasoning and leaves the operating detail thin, because that gap is
 * exactly what the experts are being asked to close.
 */
export function generatePlaybookDocument(brief: Brief, report: Report): GeneratedSection[] {
  const category = report.category;
  const science = frameworksFor(category);

  const pillars: GeneratedSection[] = report.strategicDirections.map((direction, i) => ({
    title: direction.replace(/\.$/, ""),
    blocks: [
      { kind: "insight", text: direction },
      { kind: "science", ...science[i % science.length] },
      {
        kind: "phase",
        label: "Phase 1: Establish the position",
        steps: [
          `Write down what is true today about ${brief.situation.toLowerCase().replace(/\.$/, "")}, and what evidence you have for it.`,
          "Name the one decision this pillar has to make possible, and who owns it.",
          "Record the assumptions you are relying on that have not yet been tested.",
        ],
      },
      {
        kind: "phase",
        label: "Phase 2: Prove it at small scale",
        steps: [
          "Run the smallest version of this change that would produce real evidence.",
          "Agree in advance what result would justify continuing, and what would mean stopping.",
          `Review against the outcome you are aiming for: ${brief.desiredOutcome.toLowerCase().replace(/\.$/, "")}.`,
        ],
      },
    ] as PlaybookBlockBody[],
  }));

  return [
    {
      title: "Introduction",
      blocks: [{ kind: "paragraph", text: `${brief.situation} ${brief.objective}` }],
    },
    {
      title: "Problem Statement",
      blocks: [
        { kind: "paragraph", text: report.problemSummary },
        { kind: "list", items: report.keyConsiderations },
      ],
    },
    {
      title: `Solution: ${pillars.map((p) => p.title.split(" ").slice(0, 3).join(" ")).join(", ")}`,
      blocks: [
        {
          kind: "paragraph",
          text: "Each pillar below states the insight, the evidence behind it, and the sequence to work through. They are ordered so that earlier pillars produce the evidence later ones depend on.",
        },
      ],
      children: pillars,
    },
    {
      title: "Checklist for Action Steps",
      blocks: [
        {
          kind: "checklist",
          items: pillars.flatMap((p) =>
            p.blocks
              .filter((b): b is Extract<PlaybookBlockBody, { kind: "phase" }> => b.kind === "phase")
              .flatMap((b) => b.steps),
          ),
        },
      ],
    },
    {
      title: "Week-by-Week Roadmap",
      blocks: [
        {
          kind: "table",
          columns: ["Timing", "Focus and deliverable"],
          rows: pillars.flatMap((pillar, i) => [
            [`Week ${i * 2 + 1}`, `${pillar.title}. Establish the position and record the open assumptions.`],
            [`Week ${i * 2 + 2}`, `${pillar.title}. Run the small-scale test and review against the agreed threshold.`],
          ]),
        },
      ],
    },
    {
      title: "Decision & Escalation Matrix",
      blocks: [
        {
          kind: "table",
          columns: ["Decision type", "Who can decide", "When it escalates"],
          rows: pillars.map((pillar) => [
            pillar.title,
            brief.authority || "The accountable owner",
            "Escalate when the evidence contradicts the assumption this pillar rests on, or the constraint below is breached.",
          ]),
        },
      ],
    },
    {
      title: "Success Metrics",
      blocks: [
        {
          kind: "list",
          items: [brief.desiredOutcome, ...report.strategicDirections.map((d) => `Evidence that: ${d.toLowerCase()}`)],
        },
      ],
    },
    {
      title: "Potential Issues & Mitigation",
      blocks: [
        {
          kind: "table",
          columns: ["Risk", "Mitigation"],
          rows: report.risks.map((risk) => [risk, "To be strengthened by expert experience."]),
        },
      ],
    },
    {
      title: "External Resources",
      blocks: [{ kind: "list", items: report.resources.length > 0 ? report.resources : report.frameworks }],
    },
  ];
}
