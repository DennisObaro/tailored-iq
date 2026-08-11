"use client";

import { Check } from "lucide-react";
import type { PlaybookActionItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

const STATUS_CYCLE: PlaybookActionItem["status"][] = ["not_started", "in_progress", "done"];

export function PlaybookActionItemRow({
  item,
  onChangeStatus,
}: {
  item: PlaybookActionItem;
  onChangeStatus: (status: PlaybookActionItem["status"]) => void;
}) {
  const done = item.status === "done";

  function cycle() {
    const nextIndex = (STATUS_CYCLE.indexOf(item.status) + 1) % STATUS_CYCLE.length;
    onChangeStatus(STATUS_CYCLE[nextIndex]);
  }

  return (
    <div className="flex items-start gap-3 border-b border-gray-800 py-3 last:border-0">
      <button
        onClick={cycle}
        aria-pressed={done}
        aria-label={`Mark "${item.title}" as ${done ? "not done" : "done"}`}
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          done
            ? "border-primary-500 bg-primary-500 text-gray-975"
            : item.status === "in_progress"
              ? "border-primary-500 text-primary-400"
              : "border-gray-700 text-transparent hover:border-gray-600",
        )}
      >
        {done && <Check className="size-3" aria-hidden />}
      </button>
      <div className="flex-1">
        <p className={cn("text-sm font-medium", done ? "text-gray-500 line-through" : "text-gray-100")}>
          {item.title}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">{item.description}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <Badge variant="outline">{item.timeframe}</Badge>
          <Badge variant="outline" className="capitalize">
            {item.owner}
          </Badge>
        </div>
      </div>
    </div>
  );
}
