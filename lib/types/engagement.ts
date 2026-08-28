export type EngagementStatus = "in_progress" | "pending_completion" | "completed";

/**
 * Tracked implementation work between a client and one expert on one
 * playbook — created when the client books implementation support from the
 * playbook's "Need help implementing this?" panel. Deliberately separate
 * from `Project` (lib/types/project.ts), which is the diagnosis pipeline.
 */
export interface Engagement {
  id: string;
  clientId: string;
  expertId: string;
  playbookId: string;
  /** The diagnostic project this playbook came from. Always present — booking is only offered for project-generated playbooks. */
  projectId: string;
  /** The ExpertConversation thread reused as this engagement's chat. */
  conversationId: string;
  status: EngagementStatus;
  completionProposedBy?: "client" | "expert";
  completionProposedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EngagementReview {
  id: string;
  engagementId: string;
  fromUserId: string;
  fromRole: "client" | "expert";
  toUserId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}
