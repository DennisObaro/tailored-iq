import { simulateNetwork } from "@/lib/api/client";

export interface ContactSubmission {
  name: string;
  email: string;
  organisation?: string;
  role: string;
  message: string;
}

/**
 * Marketing-site contact form.
 *
 * The landing-page project backed this with a TanStack `createServerFn` that
 * sent two Resend emails (a notification to the team and a confirmation to
 * the sender). There is no server or mail provider in this prototype — see
 * CLAUDE.md — so this is the same shape with the send stubbed out, keeping
 * the page on the `lib/api/*` boundary every other screen uses.
 *
 * A real backend replaces this body with the POST and deletes nothing else:
 * the form already treats a rejected promise as its error state.
 */
export async function submitContactForm(input: ContactSubmission): Promise<{ ok: true }> {
  return simulateNetwork(() => {
    if (!input.name.trim() || !input.email.trim() || !input.message.trim()) {
      throw new Error("Please fill in your name, email, and message.");
    }
    return { ok: true } as const;
  });
}
