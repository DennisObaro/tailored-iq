import { useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/input";

export function BriefField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className="flex items-start gap-4 border-b border-gray-850 py-2 last:border-0">
      <p className="w-28 shrink-0 pt-2 text-xs font-medium text-gray-500">{label}</p>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none overflow-hidden border-transparent bg-transparent px-2 py-1.5 leading-relaxed text-gray-100 focus:border-gray-800 focus:bg-gray-900"
      />
    </div>
  );
}
