import { addDays, addMinutes, isBefore, startOfDay } from "date-fns";
import type { ExpertWeeklyAvailability } from "@/lib/types";

/**
 * Turning a weekly pattern into actual bookable datetimes.
 *
 * Pure date maths, with no knowledge of what's already booked — the API layer
 * owns that, because only it can see other people's consultations. Keeping
 * the expansion here means the calendar and the booking guard agree on which
 * datetimes exist by construction rather than by both being careful.
 */

/** How far ahead a client may book. Beyond this a stated weekly pattern is a weak promise. */
export const BOOKING_WINDOW_DAYS = 28;

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** "14:30" -> that time on `date`. Returns null for anything malformed. */
export function atTime(date: Date, time: string): Date | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return addMinutes(addMinutes(startOfDay(date), hours * 60), minutes);
}

export function formatTimeLabel(time: string): string {
  const parsed = atTime(new Date(), time);
  if (!parsed) return time;
  const hours = parsed.getHours();
  const minutes = parsed.getMinutes();
  const suffix = hours < 12 ? "AM" : "PM";
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelve}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

/** The times this expert offers on a given calendar date, in order. */
export function timesForDate(availability: ExpertWeeklyAvailability[], date: Date): string[] {
  const day = availability.find((a) => a.weekday === date.getDay());
  return day ? [...day.times].sort() : [];
}

export interface SlotCandidate {
  /** The datetime itself, which is what gets booked. */
  iso: string;
  time: string;
}

/**
 * Every datetime the pattern produces inside the booking window, skipping
 * anything inside the expert's stated notice period — an expert who asks for
 * two days' notice should never be shown tomorrow.
 */
export function expandAvailability(
  availability: ExpertWeeklyAvailability[],
  options: { noticeDays?: number; windowDays?: number; from?: Date } = {},
): SlotCandidate[] {
  const { noticeDays = 0, windowDays = BOOKING_WINDOW_DAYS, from = new Date() } = options;
  const earliest = addDays(from, noticeDays);

  const out: SlotCandidate[] = [];
  for (let offset = 0; offset <= windowDays; offset++) {
    const date = addDays(startOfDay(from), offset);
    for (const time of timesForDate(availability, date)) {
      const slot = atTime(date, time);
      if (!slot || isBefore(slot, earliest)) continue;
      out.push({ iso: slot.toISOString(), time });
    }
  }
  return out;
}

/** Whether a date has at least one slot the pattern still allows. */
export function isDateBookable(
  availability: ExpertWeeklyAvailability[],
  date: Date,
  options: { noticeDays?: number; windowDays?: number; from?: Date } = {},
): boolean {
  const { noticeDays = 0, windowDays = BOOKING_WINDOW_DAYS, from = new Date() } = options;
  const earliest = addDays(from, noticeDays);
  const last = addDays(startOfDay(from), windowDays);
  if (isBefore(last, date)) return false;
  return timesForDate(availability, date).some((time) => {
    const slot = atTime(date, time);
    return slot !== null && !isBefore(slot, earliest);
  });
}

/** How an expert's week reads in a sentence: "Tuesdays and Thursdays". */
export function describeAvailability(availability: ExpertWeeklyAvailability[]): string {
  const days = availability
    .filter((a) => a.times.length > 0)
    .sort((a, b) => a.weekday - b.weekday)
    .map((a) => `${WEEKDAY_LABELS[a.weekday]}s`);
  if (days.length === 0) return "No availability set";
  if (days.length === 1) return days[0];
  return `${days.slice(0, -1).join(", ")} and ${days[days.length - 1]}`;
}
