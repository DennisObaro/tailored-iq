import type { ExpertContribution } from "@/lib/types";
import { simulateNetwork, ApiError } from "./client";
import { db } from "./_db";
import { id } from "@/lib/utils/id";

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

export async function addContribution(input: {
  expertId: string;
  projectId: string;
  content: string;
}): Promise<ExpertContribution> {
  return simulateNetwork(() =>
    db.update((d) => {
      const project = d.projects.find((p) => p.id === input.projectId);
      if (!project) throw new ApiError("Project not found.", "NOT_FOUND");

      const now = new Date().toISOString();
      const contribution: ExpertContribution = {
        id: id("contribution"),
        expertId: input.expertId,
        projectId: input.projectId,
        playbookId: project.playbookId,
        type: "playbook_input",
        content: input.content,
        status: "published",
        createdAt: now,
      };
      d.contributions.push(contribution);

      if (project.playbookId) {
        const playbook = d.playbooks.find((p) => p.id === project.playbookId);
        if (playbook) {
          playbook.expertContributionIds.push(contribution.id);
          playbook.sections.push({ heading: "Additional expert contribution", body: input.content });
          playbook.updatedAt = now;
          playbook.status = "updated";
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
        }
      } else {
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

      return contribution;
    }),
  );
}
