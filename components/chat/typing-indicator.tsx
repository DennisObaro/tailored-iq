import { Sparkles } from "lucide-react";

export function TypingIndicator({ label = "Understanding your challenge..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-2.5" role="status" aria-live="polite">
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-500/15 text-primary-400">
        <Sparkles className="size-3.5" aria-hidden />
      </div>
      <div className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3.5 py-2.5 text-sm text-gray-400">
        <span>{label}</span>
        <span className="flex gap-0.5">
          <span className="size-1 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.3s]" />
          <span className="size-1 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.15s]" />
          <span className="size-1 animate-bounce rounded-full bg-gray-500" />
        </span>
      </div>
    </div>
  );
}
