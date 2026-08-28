"use client";

import type { Brief } from "@/lib/types";
import { CheckCircle2, Pencil } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BriefField } from "@/components/brief/brief-field";
import { BriefProse } from "@/components/brief/brief-readout";

const BRIEF_FIELD_DEFS: { key: keyof Brief; label: string }[] = [
  { key: "situation", label: "Situation" },
  { key: "objective", label: "Goal" },
  { key: "existingActions", label: "Tried already" },
  { key: "constraints", label: "Constraints" },
  { key: "authority", label: "Authority" },
  { key: "desiredOutcome", label: "Desired outcome" },
];

/**
 * The diagnosis read back to the client before it drives anything else.
 *
 * Two modes over one record. Reading is the default and is prose — the
 * client is checking "did it understand me?", which is a judgement about a
 * narrative, not a row-by-row audit. Editing swaps in the structured fields,
 * because correcting a misheard fact means touching that fact, not rewriting
 * a paragraph. The prose is re-derived server-side on save, so what the card
 * reads back after an edit always reflects the edit.
 */
export function BriefCard({
  brief,
  editing,
  onEditingChange,
  onFieldChange,
  onConfirm,
  confirming,
  saving,
}: {
  brief: Brief;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  onFieldChange: (key: keyof Brief, value: string) => void;
  onConfirm: () => void;
  confirming: boolean;
  saving: boolean;
}) {
  const locked = confirming || saving || brief.confirmed;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold tracking-tight text-gray-50">
        Here&apos;s what I&apos;m hearing
      </h3>

      {editing ? (
        <div className="mt-4 flex flex-col">
          {BRIEF_FIELD_DEFS.map((f) => (
            <BriefField
              key={f.key}
              label={f.label}
              value={String(brief[f.key] ?? "")}
              onChange={(v) => onFieldChange(f.key, v)}
              disabled={locked}
            />
          ))}
        </div>
      ) : (
        <BriefProse brief={brief} />
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        {brief.confirmed ? (
          <p className="flex items-center gap-1.5 text-xs font-medium text-success-400">
            <CheckCircle2 className="size-3.5" aria-hidden />
            Brief confirmed
          </p>
        ) : (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5"
              loading={saving}
              disabled={confirming}
              onClick={() => onEditingChange(!editing)}
            >
              {!saving && <Pencil className="size-3.5" aria-hidden />}
              {editing ? "Done editing" : "Edit details"}
            </Button>
            <Button size="sm" loading={confirming} onClick={onConfirm} className="gap-1.5">
              <CheckCircle2 className="size-3.5" aria-hidden />
              Confirm brief
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
