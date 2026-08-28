"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  format,
  isAfter,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import type { AvailableSlot } from "@/lib/api/consultations";
import { BOOKING_WINDOW_DAYS, formatTimeLabel } from "@/lib/utils/availability";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * Pick a date, then a time on it.
 *
 * The calendar is driven entirely by the slots the API returned: a date is
 * selectable because it has one, not because of anything this component knows
 * about the expert's week. That's what keeps "you can only book Tuesdays and
 * Thursdays" true without the rule being written down twice.
 */
export function AvailabilityCalendar({
  slots,
  selected,
  onSelect,
}: {
  slots: AvailableSlot[];
  selected: string | null;
  onSelect: (iso: string) => void;
}) {
  const today = startOfDay(new Date());
  const lastBookableDay = addDays(today, BOOKING_WINDOW_DAYS);

  /** Slots grouped by calendar day, which is the unit the grid works in. */
  const byDay = useMemo(() => {
    const map = new Map<string, AvailableSlot[]>();
    for (const slot of slots) {
      const key = format(new Date(slot.iso), "yyyy-MM-dd");
      const existing = map.get(key);
      if (existing) existing.push(slot);
      else map.set(key, [slot]);
    }
    return map;
  }, [slots]);

  const firstOpenDay = useMemo(() => {
    const open = slots.find((s) => !s.taken);
    return open ? startOfDay(new Date(open.iso)) : null;
  }, [slots]);

  const [month, setMonth] = useState(() => startOfMonth(firstOpenDay ?? today));
  const [activeDay, setActiveDay] = useState<Date | null>(
    selected ? startOfDay(new Date(selected)) : firstOpenDay,
  );

  // Six rows always, so the grid doesn't jump height between months.
  const gridStart = startOfWeek(startOfMonth(month));
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  const daySlots = (date: Date) => byDay.get(format(date, "yyyy-MM-dd")) ?? [];
  const hasOpenSlot = (date: Date) => daySlots(date).some((s) => !s.taken);

  const canGoBack = isAfter(month, startOfMonth(today));
  const canGoForward = !isAfter(startOfMonth(addMonths(month, 1)), startOfMonth(lastBookableDay));

  const activeSlots = activeDay ? daySlots(activeDay) : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full"
          disabled={!canGoBack}
          onClick={() => setMonth((m) => addMonths(m, -1))}
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <p className="text-sm font-medium text-gray-100">{format(month, "MMMM yyyy")}</p>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full"
          disabled={!canGoForward}
          onClick={() => setMonth((m) => addMonths(m, 1))}
          aria-label="Next month"
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>

      <div>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAY_INITIALS.map((initial, i) => (
            <span key={i} className="py-1 text-center text-[11px] font-medium text-gray-500">
              {initial}
            </span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((date) => {
            const outside = !isSameMonth(date, month);
            const open = hasOpenSlot(date);
            const isActive = activeDay ? isSameDay(date, activeDay) : false;
            return (
              <button
                key={date.toISOString()}
                type="button"
                disabled={!open}
                onClick={() => setActiveDay(date)}
                aria-label={format(date, "EEEE d MMMM")}
                aria-current={isActive ? "date" : undefined}
                className={cn(
                  "flex h-9 items-center justify-center rounded-lg text-sm transition-colors",
                  outside && "opacity-40",
                  // Unavailable days stay visible but plainly inert — a gap in
                  // the grid would read as a rendering fault, not a closed day.
                  !open && "cursor-not-allowed text-gray-700",
                  open && !isActive && "text-gray-100 hover:bg-gray-850",
                  open && !isActive && "ring-1 ring-inset ring-gray-800",
                  isActive && "bg-primary-500 font-medium text-gray-950",
                )}
              >
                {format(date, "d")}
              </button>
            );
          })}
        </div>
      </div>

      {activeDay && activeSlots.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            {format(activeDay, "EEEE d MMMM")}
          </p>
          <div className="flex flex-wrap gap-2">
            {activeSlots.map((slot) => {
              const isSelected = selected === slot.iso;
              return (
                <button
                  key={slot.iso}
                  type="button"
                  disabled={slot.taken}
                  onClick={() => onSelect(slot.iso)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm transition-colors",
                    slot.taken && "cursor-not-allowed border-gray-850 text-gray-600 line-through",
                    !slot.taken && !isSelected && "border-gray-800 text-gray-200 hover:border-gray-700 hover:bg-gray-900",
                    isSelected && "border-primary-500 bg-primary-500/10 text-gray-50",
                  )}
                >
                  {formatTimeLabel(slot.time)}
                  {slot.taken && <span className="sr-only"> — already booked</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
