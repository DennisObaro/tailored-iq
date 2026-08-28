import type {
  Brief,
  ExpertEngagementStage,
  ExpertWillingness,
  Opportunity,
  OpportunityResponse,
  Project,
} from "@/lib/types";
import { simulateNetwork, ApiError } from "./client";
import { db, type Database } from "./_db";
import { getExpertAccess } from "@/lib/utils/expert-access";
import { matchPercent, scoreExperts } from "@/lib/ai-sim/expert-matcher";

/**
 * What the expert is allowed to see of a client's challenge before they
 * accept. Everything past the summary — the brief, the report, the
 * transcript — stays behind acceptance (spec §30).
 */
export interface OpportunityListing {
  opportunity: Opportunity;
  stage: ExpertEngagementStage;
  /** False while the expert hasn't accepted, or isn't approved. */
  canViewClientDetail: boolean;
  /**
   * How well this expert fits the challenge, as a share of the most anyone
   * could score. Recomputed on read rather than stored, so it always
   * reflects the profile the expert has now.
   */
  matchPercent: number;
  /**
   * The client's confirmed brief, if there is one yet.
   *
   * Deliberately disclosed before the expert answers, unlike everything else
   * behind `canViewClientDetail`: deciding whether you can actually help is
   * what the brief is for, and an expert opting in from a one-line summary is
   * guessing. Everything else still gates it — the reader has to be the
   * expert this opportunity was sent to, their profile has to be approved,
   * and a brief the client hasn't confirmed is never shown.
   */
  brief: Brief | null;
}

export function engagementStage(opportunity: Opportunity, project: Project | undefined): ExpertEngagementStage {
  if (opportunity.response === "not_for_me") return "declined";

  /**
   * A direct intake has its own two-step arc and skips the interest question
   * entirely — the client already chose this expert. It's "pending" until the
   * brief exists, and from there rejoins the normal lifecycle below.
   */
  if (opportunity.kind === "direct_intake") {
    if (!project) return "intake_pending";
    if (!project.briefId) return "intake_pending";
    if (project.status === "brief_submitted" || project.status === "analysing") return "intake_submitted";
  } else {
    if (opportunity.response !== "interested") return opportunity.viewedAt ? "reviewing" : "new";
  }

  if (!project) return "accepted";

  switch (project.status) {
    case "consultation_scheduled":
      return "call_scheduled";
    case "consultation_completed":
      return "call_completed";
    case "playbook_in_progress":
    case "expert_review":
      return "playbook_contribution";
    case "playbook_ready":
    case "completed":
      return "completed";
    default:
      return "contributing";
  }
}

function listingFor(d: Database, opportunity: Opportunity, viewerId?: string): OpportunityListing {
  const project = d.projects.find((p) => p.id === opportunity.projectId);
  const profile = d.expertProfiles.find((p) => p.userId === opportunity.expertId);
  const access = getExpertAccess(profile);

  const client = project ? d.clientProfiles.find((c) => c.userId === project.clientId) : undefined;
  const [scored] = profile
    ? scoreExperts([profile], opportunity.category, client ? [client.industry] : [], project?.challenge ?? "")
    : [];

  /**
   * The opportunity's own expert only. `access` above describes them, not
   * whoever is reading — without this the brief would be one URL away for
   * anyone signed in.
   */
  const isAddressee = viewerId === opportunity.expertId;
  const brief = project?.briefId ? d.briefs.find((b) => b.id === project.briefId) : undefined;

  return {
    opportunity,
    stage: engagementStage(opportunity, project),
    canViewClientDetail: access.canViewClientDetail && opportunity.response === "interested",
    matchPercent: matchPercent(scored?.score ?? 0),
    brief: isAddressee && access.canViewClientDetail && brief?.confirmed ? brief : null,
  };
}

export async function listOpportunities(expertId: string): Promise<OpportunityListing[]> {
  return simulateNetwork(
    () => {
      const database = db.get();
      return database.opportunities
        .filter((o) => o.expertId === expertId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .map((o) => listingFor(database, o, expertId));
    },
    { latency: [150, 300] },
  );
}

/**
 * `viewerId` follows the same convention as the project getters: pass it
 * whenever the result will be rendered, and the parts that aren't the
 * reader's to see come back empty.
 */
export async function getOpportunity(
  opportunityId: string,
  viewerId?: string,
): Promise<OpportunityListing | null> {
  return simulateNetwork(
    () => {
      const database = db.get();
      const opportunity = database.opportunities.find((o) => o.id === opportunityId);
      return opportunity ? listingFor(database, opportunity, viewerId) : null;
    },
    { latency: [80, 200] },
  );
}

/** Records that the expert opened it, which is what moves "new" to "reviewing". */
export async function markOpportunityViewed(opportunityId: string): Promise<Opportunity> {
  return simulateNetwork(
    () =>
      db.update((d) => {
        const opportunity = d.opportunities.find((o) => o.id === opportunityId);
        if (!opportunity) throw new ApiError("Opportunity not found.", "NOT_FOUND");
        if (!opportunity.viewedAt) opportunity.viewedAt = new Date().toISOString();
        return opportunity;
      }),
    { latency: [60, 140] },
  );
}

/**
 * Expressing interest is what grants an expert access to a client's
 * project — so it's gated on approval, not just on the profile existing.
 * Declining is always allowed.
 */
export async function respondToOpportunity(
  opportunityId: string,
  response: OpportunityResponse,
  offeredContributions: ExpertWillingness[] = [],
): Promise<OpportunityListing> {
  return simulateNetwork(() =>
    db.update((d) => {
      const opportunity = d.opportunities.find((o) => o.id === opportunityId);
      if (!opportunity) throw new ApiError("Opportunity not found.", "NOT_FOUND");

      const profile = d.expertProfiles.find((p) => p.userId === opportunity.expertId);
      const access = getExpertAccess(profile);

      if (response === "interested") {
        if (!access.canAcceptWork) {
          throw new ApiError(
            access.reason ?? "You can't take on client work yet.",
            "NOT_APPROVED",
          );
        }
        if (offeredContributions.length === 0) {
          throw new ApiError("Pick at least one way you're willing to contribute.", "VALIDATION");
        }
      }

      opportunity.response = response;
      opportunity.offeredContributions = response === "interested" ? offeredContributions : [];
      opportunity.respondedAt = new Date().toISOString();

      const project = d.projects.find((p) => p.id === opportunity.projectId);
      if (response === "interested" && project) {
        if (!project.matchedExpertIds.includes(opportunity.expertId)) {
          project.matchedExpertIds.push(opportunity.expertId);
        }
        const expert = d.users.find((u) => u.id === opportunity.expertId);
        d.notifications.unshift({
          id: `notif_${opportunity.id}_interest`,
          userId: project.clientId,
          type: "expert_matched",
          title: "An expert is available for your challenge",
          body: `${expert ? expert.firstName : "An expert"} can help with "${project.title}".`,
          linkHref: `/projects/${project.id}`,
          read: false,
          createdAt: opportunity.respondedAt,
        });
      }
      if (response === "not_for_me" && project) {
        project.matchedExpertIds = project.matchedExpertIds.filter((eid) => eid !== opportunity.expertId);
      }

      /** The responder is the addressee by definition, so the brief stays put. */
      return listingFor(d, opportunity, opportunity.expertId);
    }),
  );
}
