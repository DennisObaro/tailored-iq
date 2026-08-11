import type { LucideIcon } from "lucide-react";
import { InteractiveCard } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export function RoleSelectCard({
  icon: Icon,
  title,
  description,
  selected,
  onSelect,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <InteractiveCard
      selected={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={selected}
      className="flex items-start gap-3 p-4"
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-md",
          selected ? "bg-primary-500/15 text-primary-400" : "bg-gray-850 text-gray-400",
        )}
      >
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium text-gray-50">{title}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </InteractiveCard>
  );
}
