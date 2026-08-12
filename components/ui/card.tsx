import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-800 bg-gray-900",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 p-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-semibold text-gray-50", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-gray-400", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-2 p-4 pt-0", className)} {...props} />;
}

export interface InteractiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
}

export function InteractiveCard({ className, selected, ...props }: InteractiveCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "rounded-2xl border bg-gray-900 transition-colors cursor-pointer",
        "hover:bg-gray-850 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
        selected ? "border-primary-500" : "border-gray-800",
        className,
      )}
      {...props}
    />
  );
}
