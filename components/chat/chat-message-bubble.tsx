import type { ChatMessage } from "@/lib/types";

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isAi = message.role === "ai";

  if (isAi) {
    return <div className="text-base leading-relaxed text-gray-100">{message.content}</div>;
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl bg-gray-850 px-4 py-2.5 text-base leading-relaxed text-gray-50">
        {message.content}
      </div>
    </div>
  );
}
