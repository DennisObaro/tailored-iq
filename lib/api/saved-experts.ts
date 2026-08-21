import { simulateNetwork } from "./client";
import { db } from "./_db";
import { joinExperts, type ExpertListing } from "./experts";
import { id } from "@/lib/utils/id";

/**
 * A client's saved experts — people they've bookmarked to come back to,
 * independent of any project or match. Kept out of experts.ts because it's a
 * different concern with its own table: experts.ts answers "who is relevant",
 * this answers "who did this client choose to keep".
 */

/**
 * Just the ids, for rendering the save toggle across a grid without joining
 * every profile. Cheap enough that callers can hold it alongside whichever
 * list they're showing.
 */
export async function listSavedExpertIds(clientId: string): Promise<string[]> {
  return simulateNetwork(
    () =>
      db
        .get()
        .savedExperts.filter((s) => s.clientId === clientId)
        .map((s) => s.expertId),
    { latency: [100, 200] },
  );
}

/** The saved list itself, most recently saved first. */
export async function listSavedExperts(clientId: string): Promise<ExpertListing[]> {
  return simulateNetwork(
    () => {
      const database = db.get();
      const byUserId = new Map(joinExperts(database).map((l) => [l.user.id, l]));
      return database.savedExperts
        .filter((s) => s.clientId === clientId)
        .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
        .map((s) => byUserId.get(s.expertId))
        .filter((l): l is ExpertListing => l !== undefined);
    },
    { latency: [150, 300] },
  );
}

/**
 * Sets whether an expert is saved, rather than toggling: the caller already
 * knows which state it's asking for, and stating it outright makes the call
 * idempotent — a double-tap or a retried request can't flip it back.
 * Returns the resulting state so the caller can settle its optimistic update.
 */
export async function setExpertSaved(
  clientId: string,
  expertId: string,
  saved: boolean,
): Promise<boolean> {
  return simulateNetwork(
    () =>
      db.update((d) => {
        const existing = d.savedExperts.find(
          (s) => s.clientId === clientId && s.expertId === expertId,
        );
        if (saved && !existing) {
          d.savedExperts.push({
            id: id("saved"),
            clientId,
            expertId,
            savedAt: new Date().toISOString(),
          });
        } else if (!saved && existing) {
          d.savedExperts = d.savedExperts.filter((s) => s !== existing);
        }
        return saved;
      }),
    { latency: [120, 260] },
  );
}
