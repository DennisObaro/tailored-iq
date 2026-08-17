import type { IconComponent } from "@/components/icons";
import { cn } from "@/lib/utils/cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: IconComponent;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-800 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="flex size-10 items-center justify-center rounded-full bg-gray-900 text-gray-500">
          <Icon className="size-5" aria-hidden />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-gray-50">{title}</p>
        {description && <p className="max-w-sm text-sm text-gray-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}
