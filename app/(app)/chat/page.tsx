"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Compass, Globe, Sparkles, TrendingUp, UserPlus, Users } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/lib/store/use-session-store";
import * as projectsApi from "@/lib/api/projects";

const SUGGESTED_PROMPTS = [
  {
    icon: Globe,
    prompt: "Entering a new market",
    label: (
      <>
        Get a plan for <strong className="font-medium text-gray-50">entering a new market</strong>
      </>
    ),
  },
  {
    icon: Users,
    prompt: "Building a stronger leadership team",
    label: (
      <>
        Build a stronger <strong className="font-medium text-gray-50">leadership team</strong>
      </>
    ),
  },
  {
    icon: UserPlus,
    prompt: "Hiring and retaining top talent",
    label: (
      <>
        Improve how you <strong className="font-medium text-gray-50">hire and retain talent</strong>
      </>
    ),
  },
  {
    icon: TrendingUp,
    prompt: "Scaling operations",
    label: (
      <>
        Prepare to <strong className="font-medium text-gray-50">scale your operations</strong>
      </>
    ),
  },
  {
    icon: Compass,
    prompt: "Preparing for a major decision",
    label: (
      <>
        Get ready for a <strong className="font-medium text-gray-50">major decision</strong>
      </>
    ),
  },
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
      <h1 className="text-2xl font-semibold text-gray-50">What are you trying to solve?</h1>
      <p className="mt-2 max-w-md text-sm text-gray-400">
        TailoredIQ will ask the right questions, clarify your situation, and help you find
        relevant experience.
      </p>

      <div className="mt-8 w-full">
        <div className="flex items-center gap-3 rounded-full border border-gray-900 bg-gray-950 py-2 pl-5 pr-2 focus-within:ring-2 focus-within:ring-primary-500">
          <Sparkles className="size-4 shrink-0 text-gray-500" aria-hidden />
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
            rows={1}
            disabled={submitting}
            className="max-h-32 flex-1 resize-none bg-transparent text-sm text-gray-50 placeholder:text-gray-500 focus-visible:outline-none disabled:opacity-50"
          />
          <Button
            size="icon"
            className="rounded-full"
            loading={submitting}
            disabled={!value.trim()}
            onClick={() => start(value)}
            aria-label="Start a challenge"
          >
            <ArrowUp className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      <div className="mt-8 w-full text-left">
        {SUGGESTED_PROMPTS.map(({ icon: Icon, label, prompt }) => (
          <button
            key={prompt}
            onClick={() => start(prompt)}
            disabled={submitting}
            className="flex w-full items-center gap-3 border-b border-gray-800 py-3 text-left text-sm text-gray-300 last:border-0 hover:text-gray-50 disabled:opacity-50"
          >
            <Icon className="size-4 shrink-0 text-gray-500" aria-hidden />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
