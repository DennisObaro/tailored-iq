import type { User, ExpertProfile } from "@/lib/types";
import { simulateNetwork, simulateGeneration, ApiError } from "./client";
import { db } from "./_db";
import { matchExperts } from "@/lib/ai-sim/expert-matcher";
import { scoreCategories } from "@/lib/ai-sim/categorizer";
import { id } from "@/lib/utils/id";

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
            l.profile.expertiseTags.some((t) => t.toLowerCase().includes(q)),
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
 * and discarded. Returns [] when the conversation doesn't yet contain
 * enough signal to confidently guess a category.
 */
export async function suggestExpertsForConversation(projectId: string): Promise<ExpertListing[]> {
  return simulateNetwork(
    () => {
      const database = db.get();
      const project = database.projects.find((p) => p.id === projectId);
      if (!project) return [];
      const conversation = database.conversations.find((c) => c.id === project.conversationId);
      if (!conversation) return [];

      const text = conversation.messages
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .join(" ");
      const [top] = scoreCategories(text);
      if (!top || top.score === 0) return [];

      const client = database.clientProfiles.find((c) => c.userId === project.clientId);
      const matched = matchExperts(database.expertProfiles, top.category, client ? [client.industry] : []);

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
