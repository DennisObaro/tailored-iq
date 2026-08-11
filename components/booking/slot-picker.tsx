import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/format";

export function SlotPicker({
  slots,
  selected,
  onSelect,
}: {
  slots: string[];
  selected: string | null;
  onSelect: (slot: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {slots.map((slot) => (
        <button
          key={slot}
          onClick={() => onSelect(slot)}
          className={cn(
            "rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
            selected === slot
              ? "border-primary-500 bg-primary-500/10 text-gray-50"
              : "border-gray-800 text-gray-300 hover:border-gray-700 hover:bg-gray-900",
          )}
        >
          {formatDateTime(slot)}
        </button>
      ))}
    </div>
  );
}
