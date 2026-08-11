"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/lib/store/use-session-store";
import * as projectsApi from "@/lib/api/projects";

const SUGGESTED_PROMPTS = [
  "Entering a new market",
  "Building a stronger leadership team",
  "Hiring and retaining top talent",
  "Scaling operations",
  "Preparing for a major decision",
];

export default function NewChatPage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function start(challenge: string) {
    if (!user || !challenge.trim() || submitting) return;
    setSubmitting(true);
    const { project } = await projectsApi.createProject(user.id, challenge.trim());
    router.push(`/chat/${project.id}`);
  }

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary-500/15 text-primary-400">
        <Sparkles className="size-5" aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold text-gray-50">What are you trying to solve?</h1>
      <p className="mt-2 max-w-md text-sm text-gray-400">
        TailoredIQ will ask the right questions, clarify your situation, and help you find
        relevant experience.
      </p>

      <div className="mt-8 w-full">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              start(value);
            }
          }}
          placeholder="Describe your business challenge..."
          rows={4}
          disabled={submitting}
          className="w-full resize-none rounded-lg border border-gray-800 bg-gray-900 p-4 text-sm text-gray-50 placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        />
        <div className="mt-3 flex justify-end">
          <Button size="lg" loading={submitting} disabled={!value.trim()} onClick={() => start(value)}>
            Start a challenge
          </Button>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => start(prompt)}
            disabled={submitting}
            className="rounded-full border border-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:border-gray-700 hover:bg-gray-900 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
