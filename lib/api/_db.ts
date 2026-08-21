import type {
  User,
  ClientProfile,
  ExpertProfile,
  Project,
  Brief,
  Conversation,
  Report,
  Consultation,
  Playbook,
  ExpertContribution,
  Review,
  Notification,
  Opportunity,
  ExpertReferral,
  ExpertPolicyAcceptance,
  ExpertQuizAttempt,
  ExpertPointsTransaction,
  ExpertPeerReview,
  CallForInsight,
  ExpertBriefParticipation,
  ExpertConversation,
  ConversationMessage,
} from "@/lib/types";
import { seedDatabase } from "@/lib/mock-data/fixtures/seed";

/** Records that a user has unlocked a playbook catalog template. */
export interface PlaybookUnlock {
  id: string;
  userId: string;
  templateId: string;
  playbookId: string;
  unlockedAt: string;
}

/**
 * A client has saved an expert to come back to. A join record rather than an
 * array on the client profile, so the same shape survives a real backend
 * (one row per save, with the timestamp that orders the list).
 */
export interface SavedExpert {
  id: string;
  clientId: string;
  expertId: string;
  savedAt: string;
}

/**
 * Internal mock "database", private to lib/api/*. Nothing outside this
 * directory should import this module directly — go through the typed
 * functions in the sibling lib/api/*.ts files instead. This is the piece a
 * backend developer deletes entirely once real endpoints exist.
 */
export interface Database {
  users: User[];
  clientProfiles: ClientProfile[];
  expertProfiles: ExpertProfile[];
  projects: Project[];
  briefs: Brief[];
  conversations: Conversation[];
  reports: Report[];
  consultations: Consultation[];
  playbooks: Playbook[];
  contributions: ExpertContribution[];
  reviews: Review[];
  notifications: Notification[];
  opportunities: Opportunity[];
  playbookUnlocks: PlaybookUnlock[];
  savedExperts: SavedExpert[];
  /**
   * Expert-network tables. Evidence, expertise and availability are
   * deliberately NOT separate tables — they only ever exist as part of one
   * ExpertProfile and are stored on it, so there's no second source of
   * truth for the same facts.
   */
  expertReferrals: ExpertReferral[];
  expertPolicyAcceptances: ExpertPolicyAcceptance[];
  expertQuizAttempts: ExpertQuizAttempt[];
  expertPointsTransactions: ExpertPointsTransaction[];
  expertPeerReviews: ExpertPeerReview[];
  callsForInsight: CallForInsight[];
  /**
   * One row per (brief, expert) live-brief notification. Separate from
   * `opportunities`, which are the curated matches an expert is offered
   * after a brief is confirmed — these are the raw "a client just asked
   * something" pings that go out to everyone.
   */
  expertBriefParticipations: ExpertBriefParticipation[];
  /**
   * Private client↔expert threads. Only ever created when a client actually
   * engages an expert — a broadcast brief reaching ten experts creates ten
   * participations and zero conversations.
   */
  expertConversations: ExpertConversation[];
  conversationMessages: ConversationMessage[];
}

const STORAGE_KEY = "tiq_db_v6";
const SESSION_KEY = "tiq_session_v1";

let cache: Database | null = null;

function seed(): Database {
  return seedDatabase();
}

function persist() {
  if (typeof window === "undefined" || !cache) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  emitChange();
}

/* ------------------------------------------------------------- change feed */

/**
 * There is no server, so "real-time" is the storage layer announcing that it
 * changed. Writes in this tab notify subscribers directly; writes in another
 * tab arrive through the browser's own `storage` event. Together that's
 * enough for an expert's dashboard to light up the instant a client submits
 * a challenge in a different tab — with no polling, no sockets and no new
 * infrastructure to run.
 */
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) listener();
}

export function subscribeToDatabase(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    /**
     * Another tab wrote. Our in-memory clone is now stale, so drop it and
     * let the next read pull the new blob back out of localStorage.
     */
    cache = null;
    emitChange();
  });
}

function load(): Database {
  if (cache) return cache;
  if (typeof window === "undefined") {
    return seed();
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      cache = JSON.parse(raw) as Database;
      return cache;
    } catch {
      // corrupt cache, fall through to reseed
    }
  }
  cache = seed();
  persist();
  return cache;
}

export const db = {
  /**
   * Returns a fresh deep clone of the database, like a real fetch response
   * would. Callers (and React state built from them) never hold a live
   * reference into the internal cache, so mutations elsewhere can't leak in
   * and object-identity checks (React re-renders, useEffect deps) behave
   * the way they would against a real API.
   */
  get(): Database {
    return structuredClone(load());
  },
  /** Mutator runs against the real internal cache; the returned value is cloned before it leaves this module. */
  update<T>(mutator: (database: Database) => T): T {
    const database = load();
    const result = mutator(database);
    persist();
    return structuredClone(result);
  },
  reset() {
    cache = seed();
    persist();
  },
};

export function getSessionUserId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY);
}

export function setSessionUserId(userId: string | null) {
  if (typeof window === "undefined") return;
  if (userId) window.localStorage.setItem(SESSION_KEY, userId);
  else window.localStorage.removeItem(SESSION_KEY);
}
