/**
 * One expert's independent state on one live client brief.
 *
 * The unit is (projectId, expertId) rather than the brief alone — that's
 * what lets five experts each accept the same brief and hold five different
 * states. Accepting is deliberately not a lock: several experts work the
 * same challenge in parallel and the client picks between them later.
 *
 * There is no separate Brief entity here on purpose: a Project already
 * carries the client's first question (`challenge`), its title, category
 * and status, so this is only the participation join on top of it.
 */
export type BriefParticipationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "dismissed"
  | "expired"
  | "submitted";

export interface ExpertBriefParticipation {
  id: string;
  /** The client brief — a Project in `brief_in_progress` or later. */
  projectId: string;
  expertId: string;
  status: BriefParticipationStatus;
  createdAt: string;
  /**
   * The same instant for every expert on a brief rather than five separate
   * clocks, so an expert who logs in three minutes late sees the two
   * minutes that are actually left rather than a fresh five.
   */
  expiresAt: string;
  acceptedAt?: string;
  declinedAt?: string;
  dismissedAt?: string;
  submittedAt?: string;
}
