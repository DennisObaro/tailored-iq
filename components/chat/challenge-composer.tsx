"use client";

import { useRef, useState } from "react";
import { ArrowUp } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { SuggestionCarousel } from "@/components/chat/suggestion-carousel";
import { SUGGESTED_QUESTIONS } from "@/lib/constants/suggestions";
import { cn } from "@/lib/utils/cn";

/**
 * The one place a challenge gets described. Home shows it to a client who
 * has never started one; Ask TailoredIQ shows the same thing to a client
 * starting their next — same frame, same examples, so describing a
 * challenge looks identical wherever it's begun.
 *
 * One frame, two layers: the message surface, and a strip of example
 * questions under it. The examples belong to the composer rather than
 * floating beneath it as navigation.
 */
export function ChallengeComposer({
  submitting,
  onStart,
  placeholder = "What are you trying to figure out?",
  className,
}: {
  submitting: boolean;
  onStart: (challenge: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");
  const [inputActive, setInputActive] = useState(false);

  return (
    <div className={cn("w-full rounded-[28px] bg-gray-950 p-2", className)}>
      <div className="relative min-h-28 w-full rounded-[22px] bg-gray-900 px-5 pt-5 pb-14 focus-within:ring-2 focus-within:ring-primary-500">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setInputActive(true)}
          onBlur={() => setInputActive(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onStart(value);
            }
          }}
          placeholder={placeholder}
          rows={1}
          disabled={submitting}
          className="w-full resize-none bg-transparent text-left text-sm italic text-gray-50 placeholder:italic placeholder:text-gray-400 focus-visible:outline-none disabled:opacity-50"
        />
        <Button
          size="icon"
          className="absolute bottom-3 right-3 h-8 w-8 rounded-full"
          loading={submitting}
          disabled={!value.trim()}
          onClick={() => onStart(value)}
          aria-label="Start a challenge"
        >
          <ArrowUp className="size-4" aria-hidden />
        </Button>
      </div>

      <SuggestionCarousel
        /* Left padding matches the input surface, so the chips line up with the message text above them. */
        className="px-5 py-3"
        suggestions={SUGGESTED_QUESTIONS}
        disabled={submitting}
        paused={inputActive || value.trim().length > 0}
        onSelect={(suggestion) => {
          setValue(suggestion);
          inputRef.current?.focus();
        }}
      />
    </div>
  );
}
