"use client";

import { useState } from "react";
import { addDays, setHours, setMinutes, startOfDay } from "date-fns";
import * as api from "@/lib/api/expert-onboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { formatCallWhen, formatCurrency } from "@/lib/utils/format";
import { StepShell, ChipToggle, type StepProps } from "./step-shell";

const TIMEZONES = ["Africa/Lagos", "Africa/Accra", "Africa/Nairobi", "Europe/London", "Europe/Berlin", "America/New_York", "Asia/Kolkata", "Asia/Singapore"];
const CALL_LENGTHS = [30, 45, 60];

/** Next two weeks of weekday slots, so an expert picks rather than types dates. */
function candidateSlots(): string[] {
  const slots: string[] = [];
  const base = startOfDay(new Date());
  for (let day = 1; day <= 14 && slots.length < 18; day++) {
    const date = addDays(base, day);
    const weekday = date.getDay();
    if (weekday === 0 || weekday === 6) continue;
    for (const hour of [10, 14, 16]) {
      slots.push(setMinutes(setHours(date, hour), 0).toISOString());
    }
  }
  return slots;
}

export function AvailabilityStep({ profile, onSaved, onBack }: StepProps) {
  const [timezone, setTimezone] = useState(profile.availabilityPreferences?.timezone ?? TIMEZONES[0]);
  const [hoursPerMonth, setHoursPerMonth] = useState(profile.availabilityPreferences?.hoursPerMonth ?? 4);
  const [callLengthMinutes, setCallLength] = useState(profile.availabilityPreferences?.callLengthMinutes ?? 45);
  const [noticeDays, setNoticeDays] = useState(profile.availabilityPreferences?.noticeDays ?? 2);
  const [rate, setRate] = useState(profile.consultationRate || 300000);
  const [slots, setSlots] = useState<string[]>(profile.availabilitySlots);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options] = useState(candidateSlots);

  function toggleSlot(slot: string) {
    setSlots((prev) => (prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      onSaved(
        await api.saveAvailability(profile.userId, {
          preferences: { timezone, hoursPerMonth, callLengthMinutes, noticeDays },
          consultationRate: rate,
          availabilitySlots: slots,
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
      blurb="How much time you want to give, and when. Clients only ever see slots you've offered."
      onNext={save}
      onBack={onBack}
      saving={saving}
      error={error}
      nextDisabled={slots.length === 0}
      footerNote={slots.length === 0 ? "Offer at least one slot." : `${slots.length} slot${slots.length === 1 ? "" : "s"} offered`}
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
          <CardTitle>Slots you&apos;re offering</CardTitle>
          <p className="text-xs text-gray-500">Pick the times you&apos;d take a call over the next two weeks.</p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          {options.map((slot) => (
            <ChipToggle key={slot} selected={slots.includes(slot)} onToggle={() => toggleSlot(slot)}>
              {formatCallWhen(slot)}
            </ChipToggle>
          ))}
        </CardContent>
      </Card>
    </StepShell>
  );
}
