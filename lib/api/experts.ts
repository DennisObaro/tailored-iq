import type { User, ExpertProfile, Project } from "@/lib/types";
import { simulateNetwork, simulateGeneration, ApiError } from "./client";
import { db } from "./_db";
import { matchExperts, scoreExperts } from "@/lib/ai-sim/expert-matcher";
import { scoreCategories } from "@/lib/ai-sim/categorizer";
import { id } from "@/lib/utils/id";
import { listProjects } from "./projects";

export interface ExpertListing {
  user: User;
  profile: ExpertProfile;
}

/**
 * Client-facing listing. Filters to approved experts on the way out —
 * a pending, restricted or rejected profile is not something a client
 * should be able to see, search or book (spec §30).
 *
 * Exported for the other lib/api modules that build client-facing expert
 * lists (saved-experts.ts), so that guard is written once: an expert who
 * loses approval silently drops out of every list that goes through here,
 * including one a client had already saved.
 */
export function joinExperts(database: ReturnType<typeof db.get>): ExpertListing[] {
  return database.expertProfiles
    .filter((profile) => profile.verificationStatus === "approved")
    .map((profile) => {
      const user = database.users.find((u) => u.id === profile.userId);
      return user ? { user, profile } : null;
    })
    .filter((x): x is ExpertListing => x !== null);
}

export interface ExpertFilters {
  category?: string;
  industry?: string;
  search?: string;
}

export async function listExperts(filters: ExpertFilters = {}): Promise<ExpertListing[]> {
  return simulateNetwork(
    () => {
      let listings = joinExperts(db.get());
      if (filters.category) {
        listings = listings.filter((l) => l.profile.expertiseTags.includes(filters.category!));
      }
      if (filters.industry) {
        listings = listings.filter((l) => l.profile.industries.includes(filters.industry!));
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        listings = listings.filter(
          (l) =>
            `${l.user.firstName} ${l.user.lastName}`.toLowerCase().includes(q) ||
            l.profile.headline.toLowerCase().includes(q) ||
            l.profile.currentRole.toLowerCase().includes(q) ||
            l.profile.expertiseTags.some((t) => t.toLowerCase().includes(q)) ||
            l.profile.industries.some((i) => i.toLowerCase().includes(q)),
        );
      }
      return listings.sort((a, b) => b.profile.rating - a.profile.rating);
    },
    { latency: [150, 300] },
  );
}

export async function getExpert(userId: string): Promise<ExpertListing | null> {
  return simulateNetwork(
    () => joinExperts(db.get()).find((l) => l.user.id === userId) ?? null,
    { latency: [100, 200] },
  );
}

export async function getExpertsByIds(userIds: string[]): Promise<ExpertListing[]> {
  return simulateNetwork(
    () => joinExperts(db.get()).filter((l) => userIds.includes(l.user.id)),
    { latency: [100, 200] },
  );
}

/**
 * Read-only live preview used while a diagnosis chat is still in progress.
 * Unlike matchExpertsForProject, this never mutates the project (no status
 * change, no activity entry, no notification) — it's recomputed every turn
 * so the panel tracks the conversation as it develops.
 *
 * Deliberately wide: until the brief is confirmed nothing has been decided,
 * so this answers "who could you talk to" in relevance order rather than
 * committing to a shortlist. The real narrowing to three is
 * matchExpertsForProject, which only runs once the client confirms.
 */
export async function suggestExpertsForConversation(
  projectId: string,
  limit = 12,
): Promise<ExpertListing[]> {
  return simulateNetwork(
    () => {
      const database = db.get();
      const project = database.projects.find((p) => p.id === projectId);
      if (!project) return [];
      const conversation = database.conversations.find((c) => c.id === project.conversationId);
      if (!conversation) return [];

      const client = database.clientProfiles.find((c) => c.userId === project.clientId);

      const text = conversation.messages
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .join(" ");
      const [top] = scoreCategories(text);
      let category = top && top.score > 0 ? top.category : null;

      /**
       * Nothing in the conversation yet carries signal (e.g. right after the
       * opening message) — fall back to what the client told us about
       * themselves during onboarding, same chain as getRecommendedExperts,
       * so the panel isn't empty on turn one and only gets more specific as
       * the conversation goes on.
       */
      if (!category && client) {
        const profileText = [client.occupation, client.function, ...client.interests].join(" ");
        const [profileTop] = scoreCategories(profileText).filter((s) => s.score > 0);
        category = profileTop?.category ?? FUNCTION_TO_CATEGORY[client.function] ?? null;
      }
      /** A dual-role user shouldn't be offered a call with themselves. */
      const pool = database.expertProfiles.filter((e) => e.userId !== project.clientId);

      /**
       * Still no category even after the profile fallback (turn one on a
       * brand-new account). The wide list is "who you could talk to", so an
       * unranked top-rated pool beats an empty rail — the same last-resort
       * getRecommendedExperts falls back to.
       */
      const suggested = category
        ? matchExperts(pool, category, client ? [client.industry] : [], limit)
        : pool
            .filter((e) => e.verificationStatus === "approved")
            .sort((a, b) => b.rating - a.rating)
            .slice(0, limit);

      return suggested
        .map((profile) => {
          const user = database.users.find((u) => u.id === profile.userId);
          return user ? { user, profile } : null;
        })
        .filter((x): x is ExpertListing => x !== null);
    },
    /**
     * Slower than a plain read on purpose: this re-runs after every answer
     * and the panel narrates it ("Choosing the best experts for you"), so
     * it needs long enough to be read rather than seen as a flicker.
     */
    { latency: [700, 1100] },
  );
}

export async function matchExpertsForProject(projectId: string): Promise<ExpertListing[]> {
  return simulateGeneration(() =>
    db.update((d) => {
      const project = d.projects.find((p) => p.id === projectId);
      if (!project) throw new ApiError("Project not found.", "NOT_FOUND");
      const client = d.clientProfiles.find((c) => c.userId === project.clientId);

      const category = project.category ?? "Strategy";
      const scored = scoreExperts(
        d.expertProfiles,
        category,
        client ? [client.industry] : [],
        project.challenge,
      ).slice(0, 3);
      const matched = scored.map((m) => m.expert);

      const now = new Date().toISOString();
      /**
       * Merged, not replaced: experts who jumped on this brief while it was
       * live are already engaged on it, and overwriting the list would drop
       * them out of their own Active Projects and revoke the access they
       * were granted when they accepted.
       */
      for (const expert of matched) {
        if (!project.matchedExpertIds.includes(expert.userId)) project.matchedExpertIds.push(expert.userId);
      }
      project.status = "expert_matching";
      project.updatedAt = now;
      project.activity.push({ id: id("act"), label: "Experts matched", timestamp: now });

      /**
       * The other half of matching: each matched expert gets a real
       * opportunity in their own dashboard. Without this the client sees
       * "experts matched" while nothing ever reaches the expert side.
       */
      for (const match of scored) {
        const alreadyOffered = d.opportunities.some(
          (o) => o.projectId === project.id && o.expertId === match.expert.userId,
        );
        if (alreadyOffered) continue;

        const opportunityId = id("opportunity");
        d.opportunities.unshift({
          id: opportunityId,
          projectId: project.id,
          expertId: match.expert.userId,
          kind: "standard_brief",
          title: project.title,
          summary: project.challenge,
          relevanceReason: match.reason,
          category,
          /**
           * What the client is asking this particular expert for, drawn from
           * the three engagement modes an opportunity can offer. A playbook
           * contribution is always wanted; the call and hands-on support are
           * only requested from experts who said they're open to them.
           */
          requestedContributions: [
            "playbook_contribution" as const,
            ...(match.expert.willingness.includes("advisory_call") ? (["advisory_call"] as const) : []),
            ...(match.expert.willingness.includes("consulting_engagement")
              ? (["consulting_engagement"] as const)
              : []),
          ],
          response: null,
          offeredContributions: [],
          createdAt: now,
        });
        d.notifications.unshift({
          id: id("notif"),
          userId: match.expert.userId,
          type: "opportunity_new",
          title: "New opportunity",
          body: `A leader needs help with "${project.title}".`,
          linkHref: `/expert/opportunities/${opportunityId}`,
          read: false,
          createdAt: now,
        });
      }
      d.notifications.unshift({
        id: id("notif"),
        userId: project.clientId,
        type: "expert_matched",
        title: "Experts matched to your challenge",
        body: `We found ${matched.length} expert${matched.length === 1 ? "" : "s"} relevant to "${project.title}".`,
        linkHref: `/projects/${project.id}`,
        read: false,
        createdAt: now,
      });

      return matched
        .map((profile) => {
          const user = d.users.find((u) => u.id === profile.userId);
          return user ? { user, profile } : null;
        })
        .filter((x): x is ExpertListing => x !== null);
    }),
  );
}

export interface RecommendedExpert {
  listing: ExpertListing;
  category: string;
  reason: string;
}

export interface RecommendedExpertsResult {
  /** True once the client has started at least one challenge, regardless of whether any got categorized yet. */
  hasChats: boolean;
  recommendations: RecommendedExpert[];
}

const CATEGORY_REASON_PHRASE: Record<string, string> = {
  Strategy: "strategy",
  Leadership: "leadership",
  "People & Culture": "people & culture",
  Operations: "operations",
  "Finance & Capital": "fundraising and capital",
  "Market Expansion": "market expansion",
  "Digital & AI": "digital & AI",
  Governance: "governance",
  Partnerships: "partnerships",
  Talent: "hiring and talent",
};

/** Coarse fallback so every client function maps to some category, even one with no keyword overlap. */
const FUNCTION_TO_CATEGORY: Record<string, string> = {
  HR: "Talent",
  Finance: "Finance & Capital",
  Operations: "Operations",
  Strategy: "Strategy",
  Marketing: "Market Expansion",
  Leadership: "Leadership",
  Product: "Digital & AI",
  Sales: "Partnerships",
  Technology: "Digital & AI",
};

/**
 * `project.category` is only ever set once a brief is confirmed
 * (see confirmBrief in briefs.ts) — well past just starting a chat. For
 * anything earlier, live-score the conversation's own words (same
 * technique as suggestExpertsForConversation) so recommendations show up
 * as soon as the client's messages carry any signal, not just once the
 * full brief flow has been completed.
 */
function resolveProjectCategory(project: Project, database: ReturnType<typeof db.get>): string | null {
  if (project.category) return project.category;
  const conversation = database.conversations.find((c) => c.id === project.conversationId);
  const text = conversation
    ? conversation.messages
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .join(" ")
    : project.challenge;
  const [top] = scoreCategories(text);
  return top && top.score > 0 ? top.category : null;
}

/**
 * Recommends experts based on the client's own recent challenges rather
 * than a single project/conversation (compare matchExpertsForProject,
 * which is scoped to one project). Walks their most-recently-updated
 * projects, takes up to `limit` distinct categories in recency order, and
 * picks the best-scoring not-yet-used expert per category so the same
 * person doesn't appear twice. `recommendations` is [] when the client has
 * no categorizable projects yet; `hasChats` separately tells the caller
 * whether the client has started any challenge at all, so a brand-new
 * user (no chats ever) can be told apart from one who has chats but none
 * categorized yet.
 */
export async function getRecommendedExperts(clientId: string, limit = 3): Promise<RecommendedExpertsResult> {
  const projects = await listProjects(clientId);
  const database = db.get();
  const client = database.clientProfiles.find((c) => c.userId === clientId);
  const industries = client ? [client.industry] : [];

  const recentCategories: string[] = [];
  const categoryReasons = new Map<string, string>();

  for (const project of projects) {
    const category = resolveProjectCategory(project, database);
    if (category && !recentCategories.includes(category)) {
      recentCategories.push(category);
      categoryReasons.set(category, `Relevant to your ${CATEGORY_REASON_PHRASE[category] ?? category.toLowerCase()} challenge`);
    }
    if (recentCategories.length >= limit) break;
  }

  /**
   * No signal yet from actual challenges (brand-new client, or nothing categorized
   * yet) — fall back to what they told us about themselves during onboarding so
   * recommendations are never empty for a client who's simply never started a chat.
   */
  if (recentCategories.length < limit && client) {
    const profileText = [client.occupation, client.function, ...client.interests].join(" ");
    const scored = scoreCategories(profileText).filter((s) => s.score > 0);
    for (const { category } of scored) {
      if (recentCategories.length >= limit) break;
      if (recentCategories.includes(category)) continue;
      recentCategories.push(category);
      categoryReasons.set(category, `Relevant to your ${CATEGORY_REASON_PHRASE[category] ?? category.toLowerCase()} focus`);
    }

    const fallbackCategory = FUNCTION_TO_CATEGORY[client.function];
    if (fallbackCategory && recentCategories.length < limit && !recentCategories.includes(fallbackCategory)) {
      recentCategories.push(fallbackCategory);
      categoryReasons.set(fallbackCategory, `Relevant to your role in ${client.function}`);
    }
  }

  const usedExpertIds = new Set<string>();
  const recommendations: RecommendedExpert[] = [];
  for (const category of recentCategories) {
    const matched = matchExperts(database.expertProfiles, category, industries, limit + usedExpertIds.size);
    const pick = matched.find((e) => !usedExpertIds.has(e.userId));
    if (!pick) continue;
    const user = database.users.find((u) => u.id === pick.userId);
    if (!user) continue;
    usedExpertIds.add(pick.userId);
    recommendations.push({
      listing: { user, profile: pick },
      category,
      reason: categoryReasons.get(category) ?? `Relevant to your ${CATEGORY_REASON_PHRASE[category] ?? category.toLowerCase()} challenge`,
    });
  }

  /**
   * Last-resort fallback: still nothing matched (e.g. thin fixture data, or no
   * expert covers this client's category/industry combo) — surface the platform's
   * top-rated approved experts so a client is never shown zero recommendations.
   */
  if (recommendations.length < limit) {
    const topRated = database.expertProfiles
      .filter((e) => e.verificationStatus === "approved" && !usedExpertIds.has(e.userId))
      .sort((a, b) => b.rating - a.rating);
    for (const pick of topRated) {
      if (recommendations.length >= limit) break;
      const user = database.users.find((u) => u.id === pick.userId);
      if (!user) continue;
      usedExpertIds.add(pick.userId);
      recommendations.push({
        listing: { user, profile: pick },
        category: pick.expertiseTags[0] ?? "",
        reason: "Highly rated by clients like you",
      });
    }
  }

  return { hasChats: projects.length > 0, recommendations };
}

export interface RelevantExpertsInput {
  clientId: string;
  /** The project the document came out of. Absent for a playbook unlocked from the Explore catalog. */
  projectId?: string;
  /** The document's own words (summary, insights), scored only when there's no project match to lean on. */
  text?: string;
  limit?: number;
}

/**
 * The rail that sits beside a piece of generated output — an executive
 * summary, a playbook. Prefers the experts already matched to the project,
 * because those are the people this client has actually been introduced to.
 * Falls back to a live category match so output whose project never reached
 * matching — and a catalog playbook, which has no project at all — still
 * gets a real rail rather than an empty one.
 */
export async function getRelevantExperts({
  clientId,
  projectId,
  text = "",
  limit = 3,
}: RelevantExpertsInput): Promise<ExpertListing[]> {
  return simulateNetwork(
    () => {
      const database = db.get();
      const byUserId = new Map(joinExperts(database).map((l) => [l.user.id, l]));

      const project = projectId ? database.projects.find((p) => p.id === projectId) : undefined;
      if (project) {
        const matched = project.matchedExpertIds
          .map((expertId) => byUserId.get(expertId))
          .filter((l): l is ExpertListing => l !== undefined);
        if (matched.length > 0) return matched.slice(0, limit);
      }

      const client = database.clientProfiles.find((c) => c.userId === clientId);

      const category =
        (project ? resolveProjectCategory(project, database) : null) ??
        scoreCategories(text).find((s) => s.score > 0)?.category ??
        (client ? FUNCTION_TO_CATEGORY[client.function] : undefined) ??
        null;
      if (!category) return [];

      return matchExperts(database.expertProfiles, category, client ? [client.industry] : [], limit)
        .map((profile) => byUserId.get(profile.userId))
        .filter((l): l is ExpertListing => l !== undefined);
    },
    { latency: [250, 500] },
  );
}

export interface PeerExpertListing {
  user: User;
  profile: ExpertProfile;
  /** Expertise this peer shares with the viewing expert — the reason to collaborate. */
  sharedCategories: string[];
  publishedContributions: number;
}

/**
 * Expert-to-expert discovery (spec §22). Deliberately separate from
 * listExperts: this is the peer view — standing and contribution history
 * rather than consultation rates and booking.
 */
export async function listPeerExperts(viewerId: string, search?: string): Promise<PeerExpertListing[]> {
  return simulateNetwork(
    () => {
      const database = db.get();
      const viewer = database.expertProfiles.find((p) => p.userId === viewerId);
      const viewerTags = viewer?.expertiseTags ?? [];

      return database.expertProfiles
        .filter((p) => p.verificationStatus === "approved" && p.userId !== viewerId)
        .map((profile): PeerExpertListing | null => {
          const user = database.users.find((u) => u.id === profile.userId);
          if (!user) return null;
          return {
            user,
            profile,
            sharedCategories: profile.expertiseTags.filter((t) => viewerTags.includes(t)),
            publishedContributions: database.contributions.filter(
              (c) => c.expertId === profile.userId && c.status === "published",
            ).length,
          };
        })
        .filter((x): x is PeerExpertListing => x !== null)
        .filter((listing) => {
          if (!search) return true;
          const q = search.toLowerCase();
          return (
            `${listing.user.firstName} ${listing.user.lastName}`.toLowerCase().includes(q) ||
            listing.profile.headline.toLowerCase().includes(q) ||
            listing.profile.expertiseTags.some((t) => t.toLowerCase().includes(q))
          );
        })
        .sort((a, b) => b.sharedCategories.length - a.sharedCategories.length || b.profile.points - a.profile.points);
    },
    { latency: [150, 320] },
  );
}
