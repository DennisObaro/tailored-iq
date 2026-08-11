import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { initials } from "@/lib/utils/format";

const sizeClasses = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
  xl: "size-16 text-lg",
};

export function Avatar({
  firstName,
  lastName,
  src,
  size = "md",
  className,
}: {
  firstName: string;
  lastName: string;
  src?: string;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-850 font-medium text-gray-300",
        sizeClasses[size],
        className,
      )}
    >
      {src ? (
        <Image src={src} alt={`${firstName} ${lastName}`} fill sizes="64px" className="object-cover" />
      ) : (
        initials(firstName, lastName)
      )}
    </span>
  );
}
