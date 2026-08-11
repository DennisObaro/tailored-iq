import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "default" | "primary" | "success" | "danger" | "outline";

const variantClasses: Record<Variant, string> = {
  default: "bg-gray-850 text-gray-300",
  primary: "bg-primary-500/15 text-primary-400",
  success: "bg-success-500/15 text-success-400",
  danger: "bg-danger-500/15 text-danger-400",
  outline: "border border-gray-800 text-gray-300",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
