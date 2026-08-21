import type { Database } from "./_db";

/**
 * Who is allowed to see a project's client-confidential material — the
 * brief, the report, the playbook, the transcript.
 *
 * The client who owns it, always. An expert only while they are engaged on
 * it (matched and accepted) and only while their profile is approved: an
 * expert whose access is later restricted loses sight of the project too
 * (spec §30).
 *
 * Internal to lib/api — every getter takes an optional viewerId and runs it
 * through here, so authorisation lives next to the data rather than in each
 * page that happens to render it.
 */
export function canViewProject(d: Database, projectId: string, viewerId: string): boolean {
  const project = d.projects.find((p) => p.id === projectId);
  if (!project) return false;
  if (project.clientId === viewerId) return true;

  if (!project.matchedExpertIds.includes(viewerId)) return false;
  const expert = d.expertProfiles.find((p) => p.userId === viewerId);
  return expert?.verificationStatus === "approved";
}

/**
 * A private thread is visible to exactly the two people in it.
 *
 * Deliberately not routed through project membership: a brief broadcast to
 * ten experts puts all ten in a position to accept and work the project, and
 * none of them may read what the client said privately to one of the others.
 */
export function canViewExpertConversation(d: Database, conversationId: string, viewerId: string): boolean {
  const conversation = d.expertConversations.find((c) => c.id === conversationId);
  if (!conversation) return false;
  return conversation.clientId === viewerId || conversation.expertId === viewerId;
}
