"use client";

import { useState } from "react";
import type { ExpertWeeklyAvailability } from "@/lib/types";
import * as api from "@/lib/api/expert-onboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/format";
import { formatTimeLabel, WEEKDAY_LABELS } from "@/lib/utils/availability";
import { StepShell, ChipToggle, type StepProps } from "./step-shell";

const TIMEZONES = ["Africa/Lagos", "Africa/Accra", "Africa/Nairobi", "Europe/London", "Europe/Berlin", "America/New_York", "Asia/Kolkata", "Asia/Singapore"];
const CALL_LENGTHS = [30, 45, 60];

/** Weekdays first — an expert offering a weekend is the exception, not the default. */
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

/**
 * The times an expert can offer, on the hour and half-hour through a working
 * day. A fixed menu rather than a free-text field: every time here expands
 * cleanly into a slot, so the client's calendar can never be handed "half
 * four-ish".
 */
const TIME_OPTIONS = [
  "08:00", "09:00", "09:30", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "16:30", "17:00", "18:00", "19:00",
];

export function AvailabilityStep({ profile, onSaved, onBack }: StepProps) {
  const [timezone, setTimezone] = useState(profile.availabilityPreferences?.timezone ?? TIMEZONES[0]);
  const [hoursPerMonth, setHoursPerMonth] = useState(profile.availabilityPreferences?.hoursPerMonth ?? 4);
  const [callLengthMinutes, setCallLength] = useState(profile.availabilityPreferences?.callLengthMinutes ?? 45);
  const [noticeDays, setNoticeDays] = useState(profile.availabilityPreferences?.noticeDays ?? 2);
  const [rate, setRate] = useState(profile.consultationRate || 300000);
  const [availability, setAvailability] = useState<ExpertWeeklyAvailability[]>(profile.weeklyAvailability);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timesFor = (weekday: number) =>
    availability.find((a) => a.weekday === weekday)?.times ?? [];

  /**
   * Toggling the last time off removes the day entirely, so "Tuesday with no
   * times" can't exist — a day in the list always means a day a client can
   * book, which is what everything downstream assumes.
   */
  function toggleTime(weekday: number, time: string) {
    setAvailability((prev) => {
      const existing = prev.find((a) => a.weekday === weekday);
      if (!existing) return [...prev, { weekday, times: [time] }];
      const times = existing.times.includes(time)
        ? existing.times.filter((t) => t !== time)
        : [...existing.times, time].sort();
      if (times.length === 0) return prev.filter((a) => a.weekday !== weekday);
      return prev.map((a) => (a.weekday === weekday ? { ...a, times } : a));
    });
  }

  const offeredDays = availability.filter((a) => a.times.length > 0).length;
  const offeredTimes = availability.reduce((sum, a) => sum + a.times.length, 0);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      onSaved(
        await api.saveAvailability(profile.userId, {
          preferences: { timezone, hoursPerMonth, callLengthMinutes, noticeDays },
          consultationRate: rate,
          weeklyAvailability: availability,
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't save that just now.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <StepShell
      title="Availability and consultation preferences"
      blurb="How much time you want to give, and when. Clients only ever see times you've offered."
      onNext={save}
      onBack={onBack}
      saving={saving}
      error={error}
      nextDisabled={offeredDays === 0}
      footerNote={
        offeredDays === 0
          ? "Offer at least one time."
          : `${offeredTimes} time${offeredTimes === 1 ? "" : "s"} across ${offeredDays} day${offeredDays === 1 ? "" : "s"} each week`
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="timezone">Timezone</Label>
            <Select id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace("_", " ")}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hours">Hours per month</Label>
            <Input id="hours" type="number" min={1} max={40} value={hoursPerMonth} onChange={(e) => setHoursPerMonth(Number(e.target.value))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="length">Call length</Label>
            <Select id="length" value={callLengthMinutes} onChange={(e) => setCallLength(Number(e.target.value))}>
              {CALL_LENGTHS.map((m) => (
                <option key={m} value={m}>
                  {m} minutes
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notice">Notice required (days)</Label>
            <Input id="notice" type="number" min={0} max={14} value={noticeDays} onChange={(e) => setNoticeDays(Number(e.target.value))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rate">Consultation rate</Label>
            <Input id="rate" type="number" min={0} step={10000} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
            <p className="text-xs text-gray-500">{formatCurrency(rate)} per consultation</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your working week</CardTitle>
          <p className="text-xs text-gray-500">
            Pick the times you&apos;d take a call on each day. This repeats every week until you change it —
            clients only ever see these times, minus anything already booked.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {WEEKDAY_ORDER.map((weekday) => {
            const times = timesFor(weekday);
            return (
              <div key={weekday} className="flex flex-col gap-2 border-b border-gray-850 pb-4 last:border-0 last:pb-0">
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-medium text-gray-100">{WEEKDAY_LABELS[weekday]}</p>
                  <span className="text-xs text-gray-500">
                    {times.length === 0 ? "Not available" : `${times.length} time${times.length === 1 ? "" : "s"}`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TIME_OPTIONS.map((time) => (
                    <ChipToggle
                      key={time}
                      selected={times.includes(time)}
                      onToggle={() => toggleTime(weekday, time)}
                    >
                      {formatTimeLabel(time)}
                    </ChipToggle>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </StepShell>
  );
}
