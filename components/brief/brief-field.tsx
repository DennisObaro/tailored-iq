import { Textarea } from "@/components/ui/input";

export function BriefField({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-gray-800 pb-5 last:border-0 last:pb-0">
      <div>
        <p className="text-sm font-medium text-gray-50">{label}</p>
        <p className="text-xs text-gray-500">{hint}</p>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={2}
        className="border-transparent bg-gray-900/60 px-2.5 py-2 focus:border-gray-800"
      />
    </div>
  );
}
