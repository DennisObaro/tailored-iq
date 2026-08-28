import { create } from "zustand";
import * as savedExpertsApi from "@/lib/api/saved-experts";

/**
 * The client's saved-expert ids, held once for the whole app.
 *
 * Every expert card carries a bookmark now, and the same expert is regularly
 * on screen more than once — a card in the grid, the rail beside a summary,
 * the row it links to. The set can't belong to any one of those lists, or
 * saving in one place would leave the other copies looking unsaved.
 */
interface SavedExpertsState {
  ids: string[];
  /** Which client the ids belong to — null until the first load resolves. */
  loadedFor: string | null;
  load: (clientId: string) => Promise<void>;
  setSaved: (clientId: string, expertId: string, saved: boolean) => Promise<void>;
}

/** In-flight guard: a grid of cards all ask to load on the same tick. */
let pendingFor: string | null = null;

export const useSavedExpertsStore = create<SavedExpertsState>((set, get) => ({
  ids: [],
  loadedFor: null,

  load: async (clientId) => {
    if (get().loadedFor === clientId || pendingFor === clientId) return;
    pendingFor = clientId;
    try {
      const ids = await savedExpertsApi.listSavedExpertIds(clientId);
      set({ ids, loadedFor: clientId });
    } finally {
      pendingFor = null;
    }
  },

  /**
   * Optimistic: the bookmark fills on the tap rather than when the write
   * lands, and rolls back if it doesn't.
   */
  setSaved: async (clientId, expertId, saved) => {
    const previous = get().ids;
    set({
      ids: saved
        ? [...previous.filter((i) => i !== expertId), expertId]
        : previous.filter((i) => i !== expertId),
    });
    try {
      await savedExpertsApi.setExpertSaved(clientId, expertId, saved);
    } catch {
      set({ ids: previous });
    }
  },
}));
