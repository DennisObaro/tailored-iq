"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "@/components/icons";
import { useSessionStore } from "@/lib/store/use-session-store";
import { useHydrated } from "@/hooks/use-hydrated";
import * as projectsApi from "@/lib/api/projects";

/**
 * The marketing hero's challenge composer. Ported from the landing-page
 * project's components/HeroChallengeInput.tsx.
 *
 * Where it hands off changed: the source navigated to its own `/briefs/new`
 * intake wizard with the text as a search param. This app's equivalent
 * entry point is the chat diagnosis thread, so a signed-in submit creates
 * the project through the service layer (exactly as app/(app)/chat/page.tsx
 * does) and lands on that thread with the challenge already recorded.
 *
 * The source also stashed the typed text in localStorage for an unauthed
 * visitor, to be replayed after signup. That resume step has no counterpart
 * here, so rather than write a key nothing reads, an unauthed submit just
 * routes to sign-up.
 */
export function HeroChallengeInput() {
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useSessionStore((s) => s.user);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || busy) return;

    if (!hydrated || !user) {
      router.push("/sign-up");
      return;
    }

    setBusy(true);
    try {
      const { project } = await projectsApi.createProject(user.id, text);
      router.push(`/chat/${project.id}`);
    } catch {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="flex w-full max-w-[712px] flex-col items-center gap-3 rounded-[20px] border border-mkt-hairline bg-mkt-input px-5 pb-7 pt-5 transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] focus-within:border-[#eabd1d]/50 focus-within:shadow-[0_0_0_4px_rgba(234,189,29,0.15)] sm:h-[62px] sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:py-1.5 sm:pl-6 sm:pr-1.5"
    >
      <label htmlFor="hero-challenge" className="sr-only">
        Describe your business challenge
      </label>
      <input
        id="hero-challenge"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Describe your business challenge…"
        disabled={busy}
        className="w-full flex-1 border-0 bg-transparent px-0 py-2.5 text-base placeholder:font-medium placeholder:italic placeholder:text-mkt-text-mute focus:outline-none disabled:cursor-not-allowed"
      />
      {/* Mobile: a centred, generously tall pill of its own. Desktop:
          self-stretch (not a fixed height) so the button fills the bar's
          full height edge to edge, flush against the pill rather than
          floating inside it with its own inset. */}
      <button
        type="submit"
        disabled={busy}
        className="flex h-14 w-full shrink-0 items-center justify-center self-center whitespace-nowrap rounded-full bg-primary-500 px-6 text-[15px] font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary-400 sm:h-auto sm:w-auto sm:self-stretch"
      >
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Generate My Playbook"}
      </button>
    </form>
  );
}
