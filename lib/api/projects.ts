import type { Project, Conversation } from "@/lib/types";
import { simulateNetwork, ApiError } from "./client";
import { db } from "./_db";
import { id } from "@/lib/utils/id";

export async function listProjects(clientId: string): Promise<Project[]> {
  return simulateNetwork(
    () =>
      db
        .get()
        .projects.filter((p) => p.clientId === clientId)
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    { latency: [150, 350] },
  );
}

export async function listProjectsForExpert(expertId: string): Promise<Project[]> {
  return simulateNetwork(
    () =>
      db
        .get()
        .projects.filter((p) => p.matchedExpertIds.includes(expertId))
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    { latency: [150, 350] },
  );
}

export async function getProject(projectId: string): Promise<Project | null> {
  return simulateNetwork(() => db.get().projects.find((p) => p.id === projectId) ?? null, {
    latency: [100, 250],
  });
}

function titleFromChallenge(challenge: string) {
  const trimmed = challenge.trim();
  return trimmed.length > 70 ? `${trimmed.slice(0, 67)}...` : trimmed;
}

export async function createProject(
  clientId: string,
  challenge: string,
): Promise<{ project: Project; conversation: Conversation }> {
  return simulateNetwork(() =>
    db.update((d) => {
      const now = new Date().toISOString();
      const conversation: Conversation = {
        id: id("conversation"),
        projectId: "",
        type: "diagnosis",
        participantIds: [clientId],
        messages: [{ id: id("msg"), role: "user", content: challenge, createdAt: now }],
        turnCount: 0,
        status: "in_progress",
        startedAt: now,
      };
      const project: Project = {
        id: id("project"),
        clientId,
        title: titleFromChallenge(challenge),
        challenge,
        status: "brief_in_progress",
        conversationId: conversation.id,
        matchedExpertIds: [],
        activity: [{ id: id("act"), label: "Challenge submitted", timestamp: now }],
        createdAt: now,
        updatedAt: now,
      };
      conversation.projectId = project.id;
      d.projects.unshift(project);
      d.conversations.push(conversation);
      return { project, conversation };
    }),
  );
}

export async function addActivity(projectId: string, label: string): Promise<Project> {
  return simulateNetwork(
    () =>
      db.update((d) => {
        const project = d.projects.find((p) => p.id === projectId);
        if (!project) throw new ApiError("Project not found.", "NOT_FOUND");
        const now = new Date().toISOString();
        project.activity.push({ id: id("act"), label, timestamp: now });
        project.updatedAt = now;
        return project;
      }),
    { latency: [20, 60] },
  );
}

export async function setProjectStatus(projectId: string, status: Project["status"]): Promise<Project> {
  return simulateNetwork(
    () =>
      db.update((d) => {
        const project = d.projects.find((p) => p.id === projectId);
        if (!project) throw new ApiError("Project not found.", "NOT_FOUND");
        project.status = status;
        project.updatedAt = new Date().toISOString();
        return project;
      }),
    { latency: [20, 60] },
  );
}
