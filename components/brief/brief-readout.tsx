import type { Brief } from "@/lib/types";
import { CheckCircle2 } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

/**
 * The brief as prose — what was heard, then the gap behind it. Shared with
 * the client's own `BriefCard` so the reading an expert gets is character for
 * character the one the client confirmed; a brief that reads differently on
 * the two sides is a brief neither party can point at.
 */
export function BriefProse({ brief }: { brief: Brief }) {
  return (
    <>
      <p className="mt-4 text-base leading-relaxed text-gray-300">{brief.summary}</p>
      <hr className="my-5 border-0 border-t border-gray-800" />
      <p className="text-base leading-relaxed text-gray-300">
        <strong className="font-semibold text-gray-100">Root cause:</strong> {brief.rootCause}
      </p>
    </>
  );
}

/**
 * The same brief with nothing to do to it — for everyone downstream of the
 * client: the expert deciding whether they can help, and anyone reading the
 * record later. No edit, no confirm; those belong to the person whose
 * challenge it is.
 */
export function BriefReadout({
  brief,
  title,
  className,
}: {
  brief: Brief;
  /** Whose reading this is. The client hears it back; everyone else reads it. */
  title: string;
  className?: string;
}) {
  return (
    <Card className={cn("p-6", className)}>
      <h3 className="text-lg font-semibold tracking-tight text-gray-50">{title}</h3>
      <BriefProse brief={brief} />
      {brief.confirmed && (
        <p className="mt-6 flex items-center gap-1.5 text-xs font-medium text-success-400">
          <CheckCircle2 className="size-3.5" aria-hidden />
          Confirmed by the client
        </p>
      )}
    </Card>
  );
}
