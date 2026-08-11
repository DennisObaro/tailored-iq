export type ProjectStatus =
  | "draft"
  | "brief_in_progress"
  | "brief_submitted"
  | "analysing"
  | "report_ready"
  | "expert_matching"
  | "consultation_scheduled"
  | "consultation_completed"
  | "playbook_in_progress"
  | "expert_review"
  | "playbook_ready"
  | "completed"
  | "archived";

export interface ProjectActivityEvent {
  id: string;
  label: string;
  timestamp: string;
}

export interface Project {
  id: string;
  clientId: string;
  title: string;
  challenge: string;
  category?: string;
  status: ProjectStatus;
  conversationId?: string;
  briefId?: string;
  reportId?: string;
  matchedExpertIds: string[];
  consultationId?: string;
  playbookId?: string;
  activity: ProjectActivityEvent[];
  createdAt: string;
  updatedAt: string;
}

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  "draft",
  "brief_in_progress",
  "brief_submitted",
  "analysing",
  "report_ready",
  "expert_matching",
  "consultation_scheduled",
  "consultation_completed",
  "playbook_in_progress",
  "expert_review",
  "playbook_ready",
  "completed",
  "archived",
];

export const PROJECT_TIMELINE_STEPS: { status: ProjectStatus; label: string }[] = [
  { status: "brief_submitted", label: "Challenge submitted" },
  { status: "analysing", label: "Brief confirmed" },
  { status: "report_ready", label: "Report generated" },
  { status: "expert_matching", label: "Expert matched" },
  { status: "consultation_completed", label: "Consultation" },
  { status: "playbook_ready", label: "Playbook" },
];
