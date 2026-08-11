import { create } from "zustand";
import type { Notification } from "@/lib/types";
import * as notificationsApi from "@/lib/api/notifications";

interface NotificationsState {
  items: Notification[];
  loaded: boolean;
  load: (userId: string) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: (userId: string) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  loaded: false,
  load: async (userId) => {
    const items = await notificationsApi.listNotifications(userId);
    set({ items, loaded: true });
  },
  markRead: async (id) => {
    await notificationsApi.markRead(id);
    set({ items: get().items.map((n) => (n.id === id ? { ...n, read: true } : n)) });
  },
  markAllRead: async (userId) => {
    await notificationsApi.markAllRead(userId);
    set({ items: get().items.map((n) => ({ ...n, read: true })) });
  },
}));
