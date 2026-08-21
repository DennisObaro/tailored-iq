"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessagesSquare } from "@/components/icons";
import type { Project, User } from "@/lib/types";
import * as conversationsApi from "@/lib/api/expert-conversations";
import * as projectsApi from "@/lib/api/projects";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { useSessionStore } from "@/lib/store/use-session-store";

/**
 * The lighter of the two ways to reach an expert. Booking commits an hour;
 * this is for working out whether this is even the right person first.
 *
 * A conversation is always about a challenge, so a client who arrives
 * without one in the URL picks which of theirs it concerns — the same choice
 * the booking page asks for, for the same reason.
 */
export function MessageExpertButton({ expert, projectId }: { expert: User; projectId: string | null }) {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [chosen, setChosen] = useState(projectId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || !user.roles.includes("client") || user.id === expert.id) return null;

  async function open(withProjectId: string) {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const conversation = await conversationsApi.getOrCreateConversation({
        clientId: user.id,
        expertId: expert.id,
        projectId: withProjectId,
      });
      router.push(`/conversations/${conversation.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work. Try again.");
      setBusy(false);
    }
  }

  async function start() {
    if (!user) return;
    if (chosen) return open(chosen);
    setBusy(true);
    setProjects(await projectsApi.listProjects(user.id));
    setBusy(false);
  }

  return (
    <div className="mt-2">
      {projects === null ? (
        <>
          <Button variant="outline" className="w-full justify-center gap-1.5" loading={busy} onClick={start}>
            <MessagesSquare className="size-4" aria-hidden />
            Message {expert.firstName}
          </Button>
          <p className="mt-2 text-center text-xs text-gray-500">
            Have a question first? Start a conversation.
          </p>
        </>
      ) : projects.length === 0 ? (
        <p className="text-xs text-gray-500">
          Start a challenge first — a conversation is always about something you&apos;re working through.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-500">Which challenge is this about?</p>
          <Select value={chosen} onChange={(e) => setChosen(e.target.value)}>
            <option value="">Select a challenge</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
          <Button className="justify-center" loading={busy} disabled={!chosen} onClick={() => open(chosen)}>
            Start conversation
          </Button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
