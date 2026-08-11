import type { Notification } from "@/lib/types";
import { simulateNetwork } from "./client";
import { db } from "./_db";
import { id } from "@/lib/utils/id";

export async function listNotifications(userId: string): Promise<Notification[]> {
  return simulateNetwork(() =>
    db
      .get()
      .notifications.filter((n) => n.userId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    { latency: [100, 250] },
  );
}

export async function markRead(notificationId: string): Promise<void> {
  return simulateNetwork(() => {
    db.update((d) => {
      const n = d.notifications.find((n) => n.id === notificationId);
      if (n) n.read = true;
    });
  }, { latency: [50, 120] });
}

export async function markAllRead(userId: string): Promise<void> {
  return simulateNetwork(() => {
    db.update((d) => {
      d.notifications.filter((n) => n.userId === userId).forEach((n) => (n.read = true));
    });
  }, { latency: [80, 160] });
}

export async function createNotification(input: Omit<Notification, "id" | "createdAt" | "read">): Promise<Notification> {
  return simulateNetwork(() =>
    db.update((d) => {
      const notification: Notification = {
        ...input,
        id: id("notif"),
        read: false,
        createdAt: new Date().toISOString(),
      };
      d.notifications.unshift(notification);
      return notification;
    }),
  { latency: [30, 80] });
}
