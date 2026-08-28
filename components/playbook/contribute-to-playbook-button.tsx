"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb } from "@/components/icons";
import * as workspaceApi from "@/lib/api/playbook-workspace";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/lib/store/use-session-store";

/**
 * Takes an expert into the collaborative workspace for this project's
 * playbook, seating them on the way in. Contributing means going to the
 * document everyone else is working on — not filling in a form beside it.
 */
export function ContributeToPlaybookButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const result = await workspaceApi.openWorkspaceForProject(projectId, user.id);
      if (!result) {
        setError("The playbook for this challenge hasn't been generated yet.");
        setBusy(false);
        return;
      }
      router.push(`/expert/playbooks/${result.documentId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 self-start">
      <Button size="sm" className="gap-1.5" loading={busy} onClick={open}>
        <Lightbulb className="size-4" aria-hidden />
        Contribute to the playbook
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
