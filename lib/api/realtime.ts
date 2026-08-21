import { subscribeToDatabase } from "./_db";

/**
 * Subscribe to "something changed" — the closest thing this prototype has to
 * a realtime channel. Fires for writes in this tab and, through the
 * browser's storage event, for writes in any other tab of the same app.
 *
 * This is the single swap point: a real backend replaces the body with a
 * socket or SSE subscription and no caller changes.
 */
export function subscribeToDataChanges(listener: () => void): () => void {
  return subscribeToDatabase(listener);
}
