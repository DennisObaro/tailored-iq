import type {
  CallForInsight,
  ExpertContribution,
  ExpertContributionType,
  ExpertPeerReview,
  ExpertPointsSource,
  PeerReviewVerdict,
  User,
} from "@/lib/types";
import { simulateNetwork, ApiError } from "./client";
import { db, type Database } from "./_db";
import { id } from "@/lib/utils/id";
import { awardPointsWithin } from "./expert-points";

/** Contribution types that go into the shared knowledge base rather than one client's project. */
const KNOWLEDGE_TYPES: ExpertContributionType[] = [
  "insight",
  "case_study",
  "topic_suggestion",
  "thought_leadership",
  "expert_conversation",
];

export function isKnowledgeContribution(type: ExpertContributionType) {
  return KNOWLEDGE_TYPES.includes(type);
}

/** How many peer approvals a knowledge contribution needs before publication. */
export const REQUIRED_PEER_APPROVALS = 1;

const POINTS_FOR_TYPE: Partial<Record<ExpertContributionType, ExpertPointsSource>> = {
  insight: "insight_published",
  case_study: "case_study_published",
  thought_leadership: "insight_published",
  expert_conversation: "expert_conversation",
  playbook_input: "playbook_contribution",
  review: "brief_review",
};

export async function listContributionsByExpert(expertId: string): Promise<ExpertContribution[]> {
  return simulateNetwork(
    () =>
      db
        .get()
        .contributions.filter((c) => c.expertId === expertId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    { latency: [120, 250] },
  );
}

export async function getContribution(contributionId: string): Promise<ExpertContribution | null> {
  return simulateNetwork(() => db.get().contributions.find((c) => c.id === contributionId) ?? null, {
    latency: [80, 200],
  });
}

export interface ContributionListing {
  contribution: ExpertContribution;
  author: User;
  peerReviews: ExpertPeerReview[];
}

function join(database: Database, contribution: ExpertContribution): ContributionListing | null {
  const author = database.users.find((u) => u.id === contribution.expertId);
  if (!author) return null;
  return {
    contribution,
    author,
    peerReviews: database.expertPeerReviews.filter((r) => r.contributionId === contribution.id),
  };
}

/** The published knowledge base — the only contributions visible network-wide. */
export async function listPublishedKnowledge(filters: { type?: ExpertContributionType } = {}): Promise<
  ContributionListing[]
> {
  return simulateNetwork(
    () => {
      const database = db.get();
      return database.contributions
        .filter((c) => c.status === "published" && isKnowledgeContribution(c.type))
        .filter((c) => (filters.type ? c.type === filters.type : true))
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        .map((c) => join(database, c))
        .filter((x): x is ContributionListing => x !== null);
    },
    { latency: [150, 320] },
  );
}

/**
 * Contributions waiting on peer review, excluding the reviewer's own work
 * and anything they've already reviewed — an expert can't wave through
 * their own contribution.
 */
export async function listPeerReviewQueue(reviewerId: string): Promise<ContributionListing[]> {
  return simulateNetwork(
    () => {
      const database = db.get();
      return database.contributions
        .filter((c) => c.status === "submitted" || c.status === "under_review")
        .filter((c) => c.expertId !== reviewerId)
        .filter(
          (c) => !database.expertPeerReviews.some((r) => r.contributionId === c.id && r.reviewerId === reviewerId),
        )
        .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
        .map((c) => join(database, c))
        .filter((x): x is ContributionListing => x !== null);
    },
    { latency: [150, 320] },
  );
}

export async function listCallsForInsight(): Promise<CallForInsight[]> {
  return simulateNetwork(
    () =>
      db
        .get()
        .callsForInsight.filter((c) => new Date(c.closesAt) > new Date())
        .sort((a, b) => (a.closesAt < b.closesAt ? -1 : 1)),
    { latency: [120, 250] },
  );
}

export async function getCallForInsight(callId: string): Promise<CallForInsight | null> {
  return simulateNetwork(() => db.get().callsForInsight.find((c) => c.id === callId) ?? null, {
    latency: [80, 180],
  });
}

/* ------------------------------------------------------------------ authoring */

export interface CreateContributionInput {
  expertId: string;
  type: ExpertContributionType;
  title: string;
  content: string;
  projectId?: string;
  callForInsightId?: string;
  /** Draft stays private; submit sends it into peer review (or straight to the client for project work). */
  submit: boolean;
}

/**
 * One entry point for every kind of contribution.
 *
 * Project work (playbook input, recommendation review) goes to the client
 * who asked for it and is credited immediately. Knowledge-base work enters
 * peer review and is not visible to anyone but reviewers until approved
 * (spec §21) — nothing becomes public knowledge automatically.
 */
export async function createContribution(input: CreateContributionInput): Promise<ExpertContribution> {
  return simulateNetwork(() =>
    db.update((d) => {
      const profile = d.expertProfiles.find((p) => p.userId === input.expertId);
      if (!profile) throw new ApiError("You need an expert profile to contribute.", "NOT_FOUND");
      if (!input.title.trim() || !input.content.trim()) {
        throw new ApiError("Give your contribution a title and some content.", "VALIDATION");
      }

      const projectScoped = !isKnowledgeContribution(input.type);
      if (projectScoped) {
        if (profile.verificationStatus !== "approved") {
          throw new ApiError(
            "Only approved experts can contribute to client work.",
            "NOT_APPROVED",
          );
        }
        if (!input.projectId) throw new ApiError("Pick the project this relates to.", "VALIDATION");
      }

      const project = input.projectId ? d.projects.find((p) => p.id === input.projectId) : undefined;
      if (input.projectId && !project) throw new ApiError("Project not found.", "NOT_FOUND");
      if (project && !project.matchedExpertIds.includes(input.expertId)) {
        throw new ApiError("You aren't engaged on that project.", "FORBIDDEN");
      }

      const now = new Date().toISOString();
      const contribution: ExpertContribution = {
        id: id("contribution"),
        expertId: input.expertId,
        projectId: input.projectId,
        playbookId: project?.playbookId,
        callForInsightId: input.callForInsightId,
        type: input.type,
        title: input.title.trim(),
        content: input.content.trim(),
        status: input.submit ? (projectScoped ? "published" : "submitted") : "draft",
        peerReviewIds: [],
        incorporated: false,
        pointsAwarded: 0,
        createdAt: now,
        updatedAt: now,
      };
      d.contributions.push(contribution);

      if (input.submit && projectScoped && project) {
        applyToProject(d, contribution, project.id);
      }

      return contribution;
    }),
  );
}

/** Attaches a project contribution to the client's playbook and tells them about it. */
function applyToProject(d: Database, contribution: ExpertContribution, projectId: string) {
  const project = d.projects.find((p) => p.id === projectId);
  if (!project) return;
  const now = new Date().toISOString();

  const source = POINTS_FOR_TYPE[contribution.type];
  if (source) {
    awardPointsWithin(d, {
      expertId: contribution.expertId,
      source,
      note: contribution.title,
      contributionId: contribution.id,
    });
    contribution.pointsAwarded = d.expertPointsTransactions.find((t) => t.contributionId === contribution.id)?.points ?? 0;
  }
  contribution.acceptedAt = now;

  if (project.playbookId) {
    const playbook = d.playbooks.find((p) => p.id === project.playbookId);
    if (playbook) {
      const expert = d.users.find((u) => u.id === contribution.expertId);
      playbook.expertContributionIds.push(contribution.id);
      playbook.sections.push({
        heading: `${contribution.title} — ${expert ? `${expert.firstName} ${expert.lastName}` : "Expert"}`,
        body: contribution.content,
      });
      playbook.updatedAt = now;
      playbook.status = "updated";
      contribution.incorporated = true;
      contribution.playbookId = playbook.id;

      d.notifications.unshift({
        id: id("notif"),
        userId: project.clientId,
        type: "playbook_updated",
        title: "Your playbook has been updated",
        body: `An expert added new input to "${project.title}".`,
        linkHref: `/playbooks/${playbook.id}`,
        read: false,
        createdAt: now,
      });
      return;
    }
  }

  d.notifications.unshift({
    id: id("notif"),
    userId: project.clientId,
    type: "contribution_added",
    title: "Your expert has added an insight",
    body: `New input was added to "${project.title}".`,
    linkHref: `/projects/${project.id}`,
    read: false,
    createdAt: now,
  });
}

export async function updateContribution(
  contributionId: string,
  patch: { title?: string; content?: string },
): Promise<ExpertContribution> {
  return simulateNetwork(() =>
    db.update((d) => {
      const contribution = d.contributions.find((c) => c.id === contributionId);
      if (!contribution) throw new ApiError("Contribution not found.", "NOT_FOUND");
      if (contribution.status === "published") {
        throw new ApiError("A published contribution can't be edited.", "INVALID_STATE");
      }
      Object.assign(contribution, patch, { updatedAt: new Date().toISOString() });
      return contribution;
    }),
  );
}

/** Draft → submitted (knowledge) or published (project work). */
export async function submitContribution(contributionId: string): Promise<ExpertContribution> {
  return simulateNetwork(() =>
    db.update((d) => {
      const contribution = d.contributions.find((c) => c.id === contributionId);
      if (!contribution) throw new ApiError("Contribution not found.", "NOT_FOUND");
      if (contribution.status !== "draft" && contribution.status !== "changes_requested") {
        throw new ApiError("This contribution has already been submitted.", "INVALID_STATE");
      }

      contribution.updatedAt = new Date().toISOString();
      if (isKnowledgeContribution(contribution.type)) {
        contribution.status = "submitted";
      } else if (contribution.projectId) {
        contribution.status = "published";
        applyToProject(d, contribution, contribution.projectId);
      }
      return contribution;
    }),
  );
}

/* --------------------------------------------------------------- peer review */

/**
 * One expert's verdict on another's contribution. Enough approvals move it
 * to published and credit the author; a change request sends it back to
 * them. Either way the reviewer earns points for the review itself, because
 * reviewing is a contribution in its own right.
 */
export async function submitPeerReview(input: {
  contributionId: string;
  reviewerId: string;
  verdict: PeerReviewVerdict;
  comment: string;
}): Promise<ExpertPeerReview> {
  return simulateNetwork(() =>
    db.update((d) => {
      const contribution = d.contributions.find((c) => c.id === input.contributionId);
      if (!contribution) throw new ApiError("Contribution not found.", "NOT_FOUND");
      if (contribution.expertId === input.reviewerId) {
        throw new ApiError("You can't review your own contribution.", "FORBIDDEN");
      }
      const reviewer = d.expertProfiles.find((p) => p.userId === input.reviewerId);
      if (!reviewer || reviewer.verificationStatus !== "approved") {
        throw new ApiError("Only approved experts can peer review.", "NOT_APPROVED");
      }
      if (!input.comment.trim()) {
        throw new ApiError("Add a comment explaining your verdict.", "VALIDATION");
      }

      const now = new Date().toISOString();
      const review: ExpertPeerReview = {
        id: id("peer_review"),
        contributionId: input.contributionId,
        reviewerId: input.reviewerId,
        verdict: input.verdict,
        comment: input.comment.trim(),
        createdAt: now,
      };
      d.expertPeerReviews.push(review);
      contribution.peerReviewIds.push(review.id);
      contribution.updatedAt = now;

      awardPointsWithin(d, {
        expertId: input.reviewerId,
        source: "peer_review",
        note: `Reviewed "${contribution.title}"`,
        contributionId: contribution.id,
      });

      if (input.verdict === "request_changes") {
        contribution.status = "changes_requested";
      } else {
        const approvals = d.expertPeerReviews.filter(
          (r) => r.contributionId === contribution.id && r.verdict === "approve",
        ).length;
        contribution.status = approvals >= REQUIRED_PEER_APPROVALS ? "published" : "under_review";

        if (contribution.status === "published") {
          contribution.acceptedAt = now;
          const source = POINTS_FOR_TYPE[contribution.type];
          if (source) {
            const transaction = awardPointsWithin(d, {
              expertId: contribution.expertId,
              source,
              note: contribution.title,
              contributionId: contribution.id,
            });
            contribution.pointsAwarded = transaction?.points ?? 0;
          }
        }
      }

      d.notifications.unshift({
        id: id("notif"),
        userId: contribution.expertId,
        type: "contribution_reviewed",
        title:
          contribution.status === "published"
            ? "Your contribution is published"
            : input.verdict === "request_changes"
              ? "A reviewer suggested changes"
              : "Your contribution was reviewed",
        body: `"${contribution.title}" — ${input.comment.trim().slice(0, 120)}`,
        linkHref: `/expert/contributions/${contribution.id}`,
        read: false,
        createdAt: now,
      });

      return review;
    }),
  );
}

export async function listPeerReviewsForContribution(contributionId: string): Promise<
  { review: ExpertPeerReview; reviewer: User }[]
> {
  return simulateNetwork(
    () => {
      const database = db.get();
      return database.expertPeerReviews
        .filter((r) => r.contributionId === contributionId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .map((review) => {
          const reviewer = database.users.find((u) => u.id === review.reviewerId);
          return reviewer ? { review, reviewer } : null;
        })
        .filter((x): x is { review: ExpertPeerReview; reviewer: User } => x !== null);
    },
    { latency: [100, 200] },
  );
}
