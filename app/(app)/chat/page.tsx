"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChallengeComposer } from "@/components/chat/challenge-composer";
import { ExpertsReadyRow } from "@/components/expert/experts-ready-row";
import { useSessionStore } from "@/lib/store/use-session-store";
import * as projectsApi from "@/lib/api/projects";

export default function NewChatPage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const [submitting, setSubmitting] = useState(false);

  async function start(challenge: string) {
    if (!user || !challenge.trim() || submitting) return;
    setSubmitting(true);
    const { project } = await projectsApi.createProject(user.id, challenge.trim());
    router.push(`/chat/${project.id}`);
  }

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold text-gray-50">What are you trying to solve?</h1>
      <p className="mt-3 max-w-md text-sm leading-[1.4] text-gray-400">
        TailoredIQ will ask the right questions, clarify your situation, and help you find relevant
        experience.
      </p>

      <ChallengeComposer
        className="mt-10 max-w-3xl"
        submitting={submitting}
        onStart={start}
        placeholder="Describe your business challenge..."
      />

      <ExpertsReadyRow className="mt-6" />
    </div>
  );
}
