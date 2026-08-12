import type { User, ExpertProfile, Project } from "@/lib/types";
import { simulateNetwork, simulateGeneration, ApiError } from "./client";
import { db } from "./_db";
import { matchExperts } from "@/lib/ai-sim/expert-matcher";
import { scoreCategories } from "@/lib/ai-sim/categorizer";
import { id } from "@/lib/utils/id";
import { listProjects } from "./projects";

export interface ExpertListing {
  user: User;
  profile: ExpertProfile;
}

function joinExperts(database: ReturnType<typeof db.get>): ExpertListing[] {
  return database.expertProfiles
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
 */
export async function suggestExpertsForConversation(projectId: string): Promise<ExpertListing[]> {
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
      if (!category) return [];

      const matched = matchExperts(database.expertProfiles, category, client ? [client.industry] : []);

      return matched
        .map((profile) => {
          const user = database.users.find((u) => u.id === profile.userId);
          return user ? { user, profile } : null;
        })
        .filter((x): x is ExpertListing => x !== null);
    },
    { latency: [150, 300] },
  );
}

export async function matchExpertsForProject(projectId: string): Promise<ExpertListing[]> {
  return simulateGeneration(() =>
    db.update((d) => {
      const project = d.projects.find((p) => p.id === projectId);
      if (!project) throw new ApiError("Project not found.", "NOT_FOUND");
      const client = d.clientProfiles.find((c) => c.userId === project.clientId);

      const matched = matchExperts(d.expertProfiles, project.category ?? "Strategy", client ? [client.industry] : []);

      const now = new Date().toISOString();
      project.matchedExpertIds = matched.map((e) => e.userId);
      project.status = "expert_matching";
      project.updatedAt = now;
      project.activity.push({ id: id("act"), label: "Experts matched", timestamp: now });
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
