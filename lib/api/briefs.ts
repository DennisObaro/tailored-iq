import type { Brief } from "@/lib/types";
import { simulateGeneration, ApiError } from "./client";
import { db } from "./_db";
import { id } from "@/lib/utils/id";
import { generateBrief } from "@/lib/ai-sim/brief-generator";
import { categorizeBrief } from "@/lib/ai-sim/categorizer";

export async function getBrief(briefId: string): Promise<Brief | null> {
  return simulateGeneration(() => db.get().briefs.find((b) => b.id === briefId) ?? null, {
    latency: [80, 200],
  });
}

export async function getBriefByProject(projectId: string): Promise<Brief | null> {
  return simulateGeneration(() => db.get().briefs.find((b) => b.projectId === projectId) ?? null, {
    latency: [80, 200],
  });
}

export async function createBriefFromConversation(projectId: string): Promise<Brief> {
  return simulateGeneration(() =>
    db.update((d) => {
      const project = d.projects.find((p) => p.id === projectId);
      if (!project) throw new ApiError("Project not found.", "NOT_FOUND");
      const conversation = d.conversations.find((c) => c.id === project.conversationId);
      if (!conversation) throw new ApiError("Conversation not found.", "NOT_FOUND");

      const now = new Date().toISOString();
      const generated = generateBrief(conversation, projectId);
      const brief: Brief = { ...generated, id: id("brief"), createdAt: now, updatedAt: now };
      d.briefs.push(brief);

      project.briefId = brief.id;
      project.status = "brief_submitted";
      project.updatedAt = now;
      project.activity.push({ id: id("act"), label: "Brief drafted", timestamp: now });
      return brief;
    }),
  );
}

export async function updateBrief(briefId: string, patch: Partial<Brief>): Promise<Brief> {
  return simulateGeneration(
    () =>
      db.update((d) => {
        const brief = d.briefs.find((b) => b.id === briefId);
        if (!brief) throw new ApiError("Brief not found.", "NOT_FOUND");
        Object.assign(brief, patch, { updatedAt: new Date().toISOString() });
        return brief;
      }),
    { latency: [80, 150] },
  );
}

export async function confirmBrief(briefId: string): Promise<Brief> {
  return simulateGeneration(() =>
    db.update((d) => {
      const brief = d.briefs.find((b) => b.id === briefId);
      if (!brief) throw new ApiError("Brief not found.", "NOT_FOUND");
      const { category, secondaryCategories } = categorizeBrief(brief);

      const now = new Date().toISOString();
      brief.confirmed = true;
      brief.category = category;
      brief.secondaryCategories = secondaryCategories;
      brief.updatedAt = now;

      const project = d.projects.find((p) => p.id === brief.projectId);
      if (project) {
        project.category = category;
        project.status = "analysing";
        project.updatedAt = now;
        project.activity.push({ id: id("act"), label: "Brief confirmed", timestamp: now });
      }
      return brief;
    }),
  );
}
