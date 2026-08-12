import type { Playbook, PlaybookTemplate } from "@/lib/types";
import { simulateNetwork, simulateGeneration, ApiError } from "./client";
import { db } from "./_db";
import { id } from "@/lib/utils/id";
import { listProjects } from "./projects";
import { PLAYBOOK_TEMPLATES, PLAYBOOK_TEMPLATE_CONTENT } from "@/lib/mock-data/fixtures/playbook-catalog.fixture";

export async function listCatalog(): Promise<PlaybookTemplate[]> {
  return simulateNetwork(() => PLAYBOOK_TEMPLATES, { latency: [150, 300] });
}

export async function getCatalogEntry(templateId: string): Promise<PlaybookTemplate | null> {
  return simulateNetwork(() => PLAYBOOK_TEMPLATES.find((t) => t.id === templateId) ?? null, {
    latency: [100, 200],
  });
}

export interface OwnedTemplate {
  template: PlaybookTemplate;
  playbookId: string;
}

/** Which catalog templates this user already owns, and the real Playbook each one unlocked. */
export async function listOwnedTemplates(userId: string): Promise<OwnedTemplate[]> {
  return simulateNetwork(
    () =>
      db
        .get()
        .playbookUnlocks.filter((u) => u.userId === userId)
        .map((u) => {
          const template = PLAYBOOK_TEMPLATES.find((t) => t.id === u.templateId);
          return template ? { template, playbookId: u.playbookId } : null;
        })
        .filter((x): x is OwnedTemplate => x !== null),
    { latency: [100, 200] },
  );
}

/** Unlocks a catalog template for a user, generating its real Playbook the first time. Idempotent. */
export async function unlockTemplate(userId: string, templateId: string): Promise<Playbook> {
  return simulateGeneration(() =>
    db.update((d) => {
      const existing = d.playbookUnlocks.find((u) => u.userId === userId && u.templateId === templateId);
      if (existing) {
        const playbook = d.playbooks.find((p) => p.id === existing.playbookId);
        if (playbook) return playbook;
      }

      const template = PLAYBOOK_TEMPLATES.find((t) => t.id === templateId);
      const content = PLAYBOOK_TEMPLATE_CONTENT[templateId];
      if (!template || !content) throw new ApiError("Playbook not found.", "NOT_FOUND");

      const now = new Date().toISOString();
      const playbook: Playbook = {
        ...content,
        id: id("playbook"),
        expertContributionIds: [],
        createdAt: now,
        updatedAt: now,
      };
      d.playbooks.push(playbook);
      d.playbookUnlocks.push({ id: id("unlock"), userId, templateId, playbookId: playbook.id, unlockedAt: now });

      return playbook;
    }),
  );
}

export interface RecommendedTemplate {
  template: PlaybookTemplate;
  reason: string;
}

export interface RecommendedTemplatesResult {
  /** True once the client has started at least one challenge, regardless of whether any got categorized yet. */
  hasChats: boolean;
  recommendations: RecommendedTemplate[];
}

/**
 * Mirrors getRecommendedExperts (lib/api/experts.ts): walks the client's most
 * recently updated projects, takes up to `limit` distinct categories in
 * recency order, and matches each to a catalog template in that category.
 */
export async function getRecommendedTemplates(clientId: string, limit = 3): Promise<RecommendedTemplatesResult> {
  const projects = await listProjects(clientId);

  const recentCategories: string[] = [];
  for (const project of projects) {
    if (project.category && !recentCategories.includes(project.category)) {
      recentCategories.push(project.category);
    }
    if (recentCategories.length >= limit) break;
  }

  const used = new Set<string>();
  const recommendations: RecommendedTemplate[] = [];
  for (const category of recentCategories) {
    const match = PLAYBOOK_TEMPLATES.find((t) => t.category === category && !used.has(t.id));
    if (!match) continue;
    used.add(match.id);
    recommendations.push({ template: match, reason: `Relevant to your ${category.toLowerCase()} challenge` });
  }

  return { hasChats: projects.length > 0, recommendations };
}
