import type { ExpertWillingness } from "./user";

export type ConsultationStatus = "scheduled" | "in_call" | "completed" | "cancelled";
export type ConsultationMode = "virtual" | "on_site";

export interface TranscriptLine {
  speaker: "client" | "expert";
  text: string;
  timestampSec: number;
}

/** What the expert offered to do next after the call (spec §19). */
export interface ExpertFollowUpInterest {
  supportTypes: ExpertWillingness[];
  note: string;
  createdAt: string;
}

export interface Consultation {
  id: string;
  projectId: string;
  clientId: string;
  expertId: string;
  scheduledFor: string;
  status: ConsultationStatus;
  mode: ConsultationMode;
  /** Set when this call belongs to an implementation Engagement rather than the diagnostic booking flow. */
  engagementId?: string;
  recordingConsent: boolean;
  durationSeconds?: number;
  transcript?: TranscriptLine[];
  extractedInsights?: string[];
  expertFollowUp?: ExpertFollowUpInterest;
  createdAt: string;
}

export interface Review {
  id: string;
  consultationId: string;
  fromUserId: string;
  toUserId: string;
  usefulness: number;
  understanding: number;
  rating: number;
  comment?: string;
  createdAt: string;
}
