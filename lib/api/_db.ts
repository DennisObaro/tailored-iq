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
}

const STORAGE_KEY = "tiq_db_v1";
const SESSION_KEY = "tiq_session_v1";

let cache: Database | null = null;

function seed(): Database {
  return seedDatabase();
}

function persist() {
  if (typeof window === "undefined" || !cache) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
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
