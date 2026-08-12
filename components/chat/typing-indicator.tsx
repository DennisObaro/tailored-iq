export function TypingIndicator({ label = "Understanding your challenge..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-400" role="status" aria-live="polite">
      <span>{label}</span>
      <span className="flex gap-0.5">
        <span className="size-1 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.3s]" />
        <span className="size-1 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.15s]" />
        <span className="size-1 animate-bounce rounded-full bg-gray-500" />
      </span>
    </div>
  );
}
