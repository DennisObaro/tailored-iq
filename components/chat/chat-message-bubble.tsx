import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { Sparkles } from "lucide-react";

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isAi = message.role === "ai";
  return (
    <div className={cn("flex gap-2.5", isAi ? "justify-start" : "justify-end")}>
      {isAi && (
        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-500/15 text-primary-400">
          <Sparkles className="size-3.5" aria-hidden />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
          isAi ? "bg-gray-900 text-gray-100" : "bg-primary-500 text-gray-975",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
