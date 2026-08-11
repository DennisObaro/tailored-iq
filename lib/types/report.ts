export type ReportStatus = "generating" | "ready" | "updated" | "archived";

export interface ReportSection {
  heading: string;
  body: string;
}

export interface Report {
  id: string;
  projectId: string;
  status: ReportStatus;
  category: string;
  problemSummary: string;
  keyConsiderations: string[];
  strategicDirections: string[];
  frameworks: string[];
  risks: string[];
  resources: string[];
  sections: ReportSection[];
  createdAt: string;
  updatedAt: string;
}
