import type {
  PlaybookActivity,
  PlaybookCollaborator,
  PlaybookComment,
  PlaybookDocument,
  PlaybookDocumentSection,
} from "@/lib/types";
import { generatePlaybookDocument } from "@/lib/ai-sim/playbook-document-generator";
import { PLAYBOOK_DEADLINE_HOURS } from "@/lib/constants/playbook-workspace";
import { seedBriefs } from "./projects.fixture";
import { seedReports } from "./reports.fixture";
import { DEMO_CONTRIBUTOR_ID, DEMO_EXPERT_ID, seedUsers } from "./users.fixture";

const DOC_ID = "playbook_doc_demo";
/** project_7 — the merged-leadership challenge, which has both a brief and a report. */
const PROJECT_ID = "project_7";

function ago(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

/** Looked up rather than written down, so the log can't name the wrong expert. */
function nameOf(userId: string) {
  const user = seedUsers.find((u) => u.id === userId);
  return user ? `${user.firstName} ${user.lastName}` : "An expert";
}

/**
 * A workspace mid-collaboration, so the experience can be seen rather than
 * imagined: a Scribe with the crown, two fallback scribes behind them, four
 * contributors, and contributions in every state the Scribe has to deal with.
 */
export function seedPlaybookWorkspace(): {
  playbookDocuments: PlaybookDocument[];
  playbookSections: PlaybookDocumentSection[];
  playbookCollaborators: PlaybookCollaborator[];
  playbookComments: PlaybookComment[];
  playbookActivity: PlaybookActivity[];
} {
  const brief = seedBriefs.find((b) => b.projectId === PROJECT_ID);
  const report = seedReports.find((r) => r.projectId === PROJECT_ID);
  if (!brief || !report) {
    return {
      playbookDocuments: [],
      playbookSections: [],
      playbookCollaborators: [],
      playbookComments: [],
      playbookActivity: [],
    };
  }

  const document: PlaybookDocument = {
    id: DOC_ID,
    projectId: PROJECT_ID,
    clientId: "user_demo_client",
    title: "Aligning a newly merged leadership team",
    challenge: brief.situation,
    status: "in_collaboration",
    version: 3,
    createdAt: ago(180),
    // Three hours in, so the demo workspace shows a live countdown with most
    // of the 48-hour window still on it rather than an already-lapsed one.
    dueAt: new Date(Date.now() + (PLAYBOOK_DEADLINE_HOURS * 60 - 180) * 60_000).toISOString(),
    updatedAt: ago(2),
  };

  const sections: PlaybookDocumentSection[] = [];
  const flatten = (generated: ReturnType<typeof generatePlaybookDocument>, parentId?: string, start = 0) => {
    generated.forEach((section, i) => {
      const sectionId = `${DOC_ID}_s${sections.length}`;
      sections.push({
        id: sectionId,
        documentId: DOC_ID,
        parentId,
        title: section.title,
        /* Deterministic rather than random, so the seeded comments below can
           anchor to a known block without a lookup dance. */
        blocks: section.blocks.map((body, b) => ({ id: `${sectionId}_b${b}`, ...body })),
        order: start + i,
        version: 1,
      });
      if (section.children?.length) flatten(section.children, sectionId);
    });
  };
  flatten(generatePlaybookDocument(brief, report));

  const seat = (
    expertId: string,
    role: PlaybookCollaborator["role"],
    level: PlaybookCollaborator["level"],
    joinedMinutesAgo: number,
  ): PlaybookCollaborator => ({
    id: `collab_${expertId}`,
    documentId: DOC_ID,
    expertId,
    role,
    level,
    status: "active",
    joinedAt: ago(joinedMinutesAgo),
    /**
     * Inside the presence window on purpose. This fixture exists to show a
     * workspace mid-collaboration, and a heartbeat older than the window
     * would render it as a room nobody is in.
     */
    lastActiveAt: ago(0),
    crownExpiresAt: role === "scribe" ? new Date(Date.now() + 36 * 3_600_000).toISOString() : undefined,
  });

  /**
   * The demo contributor deliberately holds no fallback level: the second
   * demo account exists to show what an expert who can only comment and
   * suggest sees, and a lapsed crown landing on them mid-demo would quietly
   * hand them the editing rights the account is meant to lack. The chain
   * still runs 1 → 2 → 3 through the other seats.
   */
  const collaborators: PlaybookCollaborator[] = [
    seat(DEMO_EXPERT_ID, "scribe", 1, 170),
    seat(DEMO_CONTRIBUTOR_ID, "contributor", undefined, 165),
    seat("user_expert_8", "contributor", 2, 150),
    seat("user_expert_5", "contributor", 3, 120),
    seat("user_expert_7", "contributor", undefined, 45),
  ];

  /** The pillar sections are where real expert argument lands. */
  const pillar = sections.find((s) => s.parentId) ?? sections[1];
  const problem = sections.find((s) => s.title === "Problem Statement") ?? sections[1];
  const risks = sections.find((s) => s.title === "Potential Issues & Mitigation") ?? sections[0];

  /**
   * Two of the seeded comments hang off an actual passage rather than the
   * section as a whole, so the highlight-and-scroll behaviour is visible on
   * first load. The rest stay section-level, which keeps the un-anchored path
   * exercised — comments made before passages could be selected still exist.
   */
  const problemBlock = problem.blocks[0];
  const problemText = problemBlock.kind === "paragraph" ? problemBlock.text : "";
  const anchorTo = (phrase: string) => {
    const start = problemText.indexOf(phrase);
    return start === -1
      ? {}
      : { blockId: problemBlock.id, startOffset: start, endOffset: start + phrase.length, quote: phrase };
  };

  const comments: PlaybookComment[] = [
    {
      id: "pb_comment_1",
      documentId: DOC_ID,
      sectionId: pillar.id,
      expertId: DEMO_CONTRIBUTOR_ID,
      kind: "experience",
      content:
        "I ran this exact sequence through two post-merger integrations. The step that decides it is publishing decision rights before the offsite, not after — teams that meet first spend the day negotiating status instead of the work.",
      status: "accepted",
      resolvedBy: DEMO_EXPERT_ID,
      resolvedAt: ago(12),
      createdAt: ago(40),
    },
    {
      id: "pb_comment_2",
      documentId: DOC_ID,
      sectionId: problem.id,
      expertId: "user_expert_8",
      kind: "challenge",
      ...anchorTo("decision-making structures"),
      content:
        "The framing assumes the two camps disagree on strategy. In every merger I've seen at this size the strategy is agreed and the fight is about who owns the budget. Worth testing before the plan commits to alignment workshops.",
      status: "open",
      createdAt: ago(22),
    },
    {
      id: "pb_comment_3",
      documentId: DOC_ID,
      sectionId: risks.id,
      expertId: "user_expert_5",
      kind: "risk",
      content:
        "Add attrition in the acquired leadership team in months 4-6. It reliably follows a restructure of decision rights and nobody plans for it because the early signals look like normal disengagement.",
      status: "open",
      createdAt: ago(9),
    },
    {
      id: "pb_comment_4",
      documentId: DOC_ID,
      sectionId: pillar.id,
      expertId: "user_expert_7",
      kind: "alternative",
      content:
        "Consider running the pilot with one merged function rather than the whole leadership team. Cheaper to reverse if it goes badly.",
      status: "rejected",
      resolvedBy: DEMO_EXPERT_ID,
      resolvedAt: ago(6),
      createdAt: ago(30),
    },
    {
      id: "pb_comment_5",
      documentId: DOC_ID,
      sectionId: problem.id,
      expertId: "user_expert_5",
      kind: "example",
      ...anchorTo("pre-merger loyalties"),
      content:
        "A 400-person logistics business I advised put both COOs on one P&L for a quarter. The behaviour changed in weeks — shared numbers did what the workshops hadn't.",
      status: "open",
      createdAt: ago(3),
    },
  ];

  comments.push({
    id: "pb_comment_6",
    documentId: DOC_ID,
    sectionId: problem.id,
    expertId: DEMO_EXPERT_ID,
    kind: "challenge",
    parentCommentId: "pb_comment_2",
    content:
      "Fair — I've seen the budget fight too. Let me put the decision-rights question ahead of the workshop in the sequence and see if it holds.",
    status: "resolved",
    createdAt: ago(14),
  });

  const entry = (
    action: PlaybookActivity["action"],
    detail: string,
    minutesAgo: number,
    actorId?: string,
  ): PlaybookActivity => ({
    id: `pb_act_${minutesAgo}`,
    documentId: DOC_ID,
    actorId,
    action,
    detail,
    createdAt: ago(minutesAgo),
  });

  return {
    playbookDocuments: [document],
    playbookSections: sections,
    playbookCollaborators: collaborators,
    playbookComments: comments,
    playbookActivity: [
      entry("commented", `${nameOf("user_expert_5")} added an example to "${problem.title}".`, 3, "user_expert_5"),
      entry("rejected", `${nameOf(DEMO_EXPERT_ID)} rejected ${nameOf("user_expert_7")}'s alternative.`, 6, DEMO_EXPERT_ID),
      entry("commented", `${nameOf("user_expert_5")} added a risk to "${risks.title}".`, 9, "user_expert_5"),
      entry("accepted", `${nameOf(DEMO_EXPERT_ID)} accepted ${nameOf(DEMO_CONTRIBUTOR_ID)}'s experience.`, 12, DEMO_EXPERT_ID),
      entry("commented", `${nameOf("user_expert_8")} challenged an assumption in "${problem.title}".`, 22, "user_expert_8"),
      entry("joined", `${nameOf("user_expert_7")} joined the collaboration.`, 45, "user_expert_7"),
      entry("joined", `${nameOf("user_expert_5")} joined the collaboration.`, 120, "user_expert_5"),
      entry("crown_assigned", `${nameOf(DEMO_EXPERT_ID)} became Level 1 Scribe.`, 170, DEMO_EXPERT_ID),
      entry("generated", "TailoredIQ generated the initial playbook.", 180),
    ],
  };
}
