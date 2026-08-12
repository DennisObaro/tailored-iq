import type { Playbook } from "@/lib/types";
import { simulateGeneration, ApiError } from "./client";
import { db } from "./_db";
import { id } from "@/lib/utils/id";
import { generatePlaybook } from "@/lib/ai-sim/playbook-generator";

export async function getPlaybook(playbookId: string): Promise<Playbook | null> {
  return simulateGeneration(() => db.get().playbooks.find((p) => p.id === playbookId) ?? null, {
    latency: [80, 200],
  });
}

export async function listPlaybooks(clientId: string): Promise<Playbook[]> {
  return simulateGeneration(
    () => {
      const database = db.get();
      const projectIds = new Set(database.projects.filter((p) => p.clientId === clientId).map((p) => p.id));
      return database.playbooks
        .filter((p) => !!p.projectId && projectIds.has(p.projectId))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
    { latency: [120, 250] },
  );
}

export async function generatePlaybookForProject(projectId: string): Promise<Playbook> {
  return simulateGeneration(() =>
    db.update((d) => {
      const project = d.projects.find((p) => p.id === projectId);
      if (!project) throw new ApiError("Project not found.", "NOT_FOUND");
      const brief = d.briefs.find((b) => b.id === project.briefId);
      const report = d.reports.find((r) => r.id === project.reportId);
      if (!brief || !report) throw new ApiError("This project isn't ready for a playbook yet.", "NOT_READY");
      const consultation = project.consultationId
        ? (d.consultations.find((c) => c.id === project.consultationId) ?? null)
        : null;
      const contributions = d.contributions.filter((c) => c.projectId === projectId);

      const now = new Date().toISOString();
      const generated = generatePlaybook(brief, report, consultation, contributions);
      const playbook: Playbook = {
        ...generated,
        id: id("playbook"),
        projectId,
        expertContributionIds: contributions.map((c) => c.id),
        createdAt: now,
        updatedAt: now,
      };
      d.playbooks.push(playbook);

      project.playbookId = playbook.id;
      project.status = "playbook_ready";
      project.updatedAt = now;
      project.activity.push({ id: id("act"), label: "Playbook generated", timestamp: now });
      d.notifications.unshift({
        id: id("notif"),
        userId: project.clientId,
        type: "playbook_ready",
        title: "Your playbook is ready",
        body: `The ${playbook.title} for "${project.title}" is ready to view.`,
        linkHref: `/playbooks/${playbook.id}`,
        read: false,
        createdAt: now,
      });

      return playbook;
    }),
  );
}

export async function updateActionItemStatus(
  playbookId: string,
  actionItemId: string,
  status: Playbook["actionItems"][number]["status"],
): Promise<Playbook> {
  return simulateGeneration(
    () =>
      db.update((d) => {
        const playbook = d.playbooks.find((p) => p.id === playbookId);
        if (!playbook) throw new ApiError("Playbook not found.", "NOT_FOUND");
        const item = playbook.actionItems.find((a) => a.id === actionItemId);
        if (!item) throw new ApiError("Action item not found.", "NOT_FOUND");
        item.status = status;
        playbook.updatedAt = new Date().toISOString();

        const project = d.projects.find((p) => p.id === playbook.projectId);
        if (project) {
          const allDone = playbook.actionItems.every((a) => a.status === "done");
          if (allDone) {
            project.status = "completed";
            project.updatedAt = new Date().toISOString();
          }
        }
        return playbook;
      }),
    { latency: [80, 150] },
  );
}
