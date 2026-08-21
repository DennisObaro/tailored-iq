export type NotificationType =
  | "brief_ready"
  | "report_ready"
  | "expert_matched"
  | "booking_confirmed"
  | "call_reminder"
  | "playbook_ready"
  | "playbook_updated"
  | "expert_onboarding_action"
  | "opportunity_new"
  /** A client has just submitted a challenge and every approved expert is being told. */
  | "live_brief"
  | "contribution_added"
  | "expert_status_changed"
  | "contribution_reviewed"
  | "peer_review_requested";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkHref: string;
  read: boolean;
  createdAt: string;
}
