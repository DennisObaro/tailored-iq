import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary-500 text-gray-975 hover:bg-primary-400 active:bg-primary-600 disabled:bg-gray-800 disabled:text-gray-500",
  secondary:
    "bg-gray-850 text-gray-50 hover:bg-gray-800 active:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600",
  outline:
    "bg-transparent text-gray-50 border border-gray-800 hover:bg-gray-900 active:bg-gray-850 disabled:text-gray-600 disabled:border-gray-850",
  ghost:
    "bg-transparent text-gray-300 hover:bg-gray-900 hover:text-gray-50 active:bg-gray-850 disabled:text-gray-600",
  danger:
    "bg-danger-500 text-gray-50 hover:bg-danger-400 active:bg-danger-500 disabled:bg-gray-800 disabled:text-gray-500",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-base gap-2",
  icon: "h-9 w-9 p-0 justify-center",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, disabled, asChild, children, ...props },
    ref,
  ) => {
    const sharedClassName = cn(
      "inline-flex items-center rounded-md font-medium transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-975",
      "disabled:cursor-not-allowed",
      variantClasses[variant],
      sizeClasses[size],
      className,
    );

    if (asChild) {
      return (
        <Slot ref={ref} className={sharedClassName} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={sharedClassName}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
