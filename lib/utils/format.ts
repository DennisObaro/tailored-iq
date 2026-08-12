import { format, formatDistanceToNow, isToday, isTomorrow, differenceInCalendarDays } from "date-fns";

export function formatDate(iso: string) {
  return format(new Date(iso), "MMM d, yyyy");
}

export function formatDateTime(iso: string) {
  return format(new Date(iso), "MMM d, yyyy 'at' h:mm a");
}

export function formatRelative(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function formatCallWhen(iso: string) {
  const date = new Date(iso);
  const time = format(date, "h:mm a");
  if (isToday(date)) return `Today · ${time}`;
  if (isTomorrow(date)) return `Tomorrow · ${time}`;
  if (differenceInCalendarDays(date, new Date()) < 7) return `${format(date, "EEEE")} · ${time}`;
  return `${format(date, "MMM d")} · ${time}`;
}

export function isCallImminent(iso: string) {
  return isToday(new Date(iso));
}

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}
