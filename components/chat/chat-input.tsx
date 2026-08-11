"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChatInput({
  onSend,
  disabled,
  placeholder = "Describe your business challenge...",
}: {
  onSend: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <div className="flex items-end gap-2 rounded-lg border border-gray-800 bg-gray-900 p-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        aria-label="Message"
        className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-gray-50 placeholder:text-gray-500 focus:outline-none disabled:opacity-50"
      />
      <Button
        size="icon"
        disabled={disabled || !value.trim()}
        onClick={submit}
        aria-label="Send message"
      >
        <ArrowUp className="size-4" />
      </Button>
    </div>
  );
}
