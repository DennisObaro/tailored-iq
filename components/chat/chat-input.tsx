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
    <div className="flex items-end gap-2 rounded-full border border-gray-900 bg-gray-950 py-2 pl-5 pr-2 focus-within:ring-2 focus-within:ring-primary-500">
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
        className="max-h-40 flex-1 resize-none self-center bg-transparent py-1.5 text-base text-gray-50 placeholder:text-gray-500 focus:outline-none disabled:opacity-50"
      />
      <Button
        size="icon"
        className="rounded-full"
        disabled={disabled || !value.trim()}
        onClick={submit}
        aria-label="Send message"
      >
        <ArrowUp className="size-4" />
      </Button>
    </div>
  );
}
