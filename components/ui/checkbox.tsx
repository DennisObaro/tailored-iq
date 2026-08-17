import * as React from "react";
import { Check } from "@/components/icons";
import { cn } from "@/lib/utils/cn";

export type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, ...props }, ref) => (
    <span className="relative inline-flex size-4 shrink-0">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        className={cn(
          "peer size-4 shrink-0 appearance-none rounded border border-gray-700 bg-gray-900",
          "checked:border-primary-500 checked:bg-primary-500",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-975",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      <Check
        className="pointer-events-none absolute inset-0 size-4 scale-0 p-0.5 text-gray-975 peer-checked:scale-100"
        aria-hidden
      />
    </span>
  ),
);
Checkbox.displayName = "Checkbox";
