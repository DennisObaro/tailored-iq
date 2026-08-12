import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { initials } from "@/lib/utils/format";

const sizeClasses = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
  xl: "size-16 text-lg",
  "2xl": "size-32 text-3xl",
};

const dotSizeClasses = {
  sm: "size-2",
  md: "size-2.5",
  lg: "size-3",
  xl: "size-4",
  "2xl": "size-5",
};

export function Avatar({
  firstName,
  lastName,
  src,
  size = "md",
  shape = "circle",
  online,
  className,
}: {
  firstName: string;
  lastName: string;
  src?: string;
  size?: keyof typeof sizeClasses;
  shape?: "circle" | "square";
  online?: boolean;
  className?: string;
}) {
  const roundedClass = shape === "square" ? "rounded-2xl" : "rounded-full";
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", sizeClasses[size], className)}>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center overflow-hidden bg-gray-850 font-medium text-gray-300",
          roundedClass,
        )}
      >
        {src ? (
          <Image src={src} alt={`${firstName} ${lastName}`} fill sizes={size === "2xl" ? "128px" : "64px"} className="object-cover" />
        ) : (
          initials(firstName, lastName)
        )}
      </span>
      {online && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full bg-success-500 ring-2 ring-gray-950",
            dotSizeClasses[size],
          )}
          aria-hidden
        />
      )}
    </span>
  );
}
