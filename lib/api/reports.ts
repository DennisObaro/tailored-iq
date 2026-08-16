import type { Report } from "@/lib/types";
import { simulateGeneration, ApiError } from "./client";
import { db } from "./_db";
import { canViewProject } from "./_access";
import { id } from "@/lib/utils/id";
import { generateReport } from "@/lib/ai-sim/report-generator";

export async function getReport(reportId: string, viewerId?: string): Promise<Report | null> {
  return simulateGeneration(
    () => {
      const database = db.get();
      const report = database.reports.find((r) => r.id === reportId) ?? null;
      if (!report) return null;
      if (viewerId && !canViewProject(database, report.projectId, viewerId)) return null;
      return report;
    },
    { latency: [80, 200] },
  );
}

export async function listReports(clientId: string): Promise<Report[]> {
  return simulateGeneration(
    () => {
      const database = db.get();
      const projectIds = new Set(database.projects.filter((p) => p.clientId === clientId).map((p) => p.id));
      return database.reports
        .filter((r) => projectIds.has(r.projectId))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
    { latency: [120, 250] },
  );
}

export async function generateReportForProject(projectId: string): Promise<Report> {
  return simulateGeneration(() =>
    db.update((d) => {
      const project = d.projects.find((p) => p.id === projectId);
      if (!project) throw new ApiError("Project not found.", "NOT_FOUND");
      const brief = d.briefs.find((b) => b.id === project.briefId);
      if (!brief) throw new ApiError("Brief not found for this project.", "NOT_FOUND");

      const now = new Date().toISOString();
      const generated = generateReport(brief, project.category ?? "Strategy");
      const report: Report = { ...generated, id: id("report"), projectId, createdAt: now, updatedAt: now };
      d.reports.push(report);

      project.reportId = report.id;
      project.status = "report_ready";
      project.updatedAt = now;
      project.activity.push({ id: id("act"), label: "Report generated", timestamp: now });
      d.notifications.unshift({
        id: id("notif"),
        userId: project.clientId,
        type: "report_ready",
        title: "Your report is ready",
        body: `The report for "${project.title}" is ready to view.`,
        linkHref: `/reports/${report.id}`,
        read: false,
        createdAt: now,
      });
      return report;
    }),
  );
}
