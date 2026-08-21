"use client";

import { useState } from "react";
import { ArrowRight, Mail } from "@/components/icons";
import { Navigation } from "@/components/landing/navigation";
import { Footer } from "@/components/landing/footer";
import { submitContactForm } from "@/lib/api/contact";

/**
 * Ported from the landing-page project's routes/contact.tsx. The form markup
 * and validation are unchanged; the submit now goes through
 * `lib/api/contact.ts` (this app's service-layer boundary) instead of a
 * TanStack server function calling Resend. See that file for what a real
 * backend would need to fill in.
 */
export function ContactContent() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    if (!name || !email || !message) {
      setError("Please fill in your name, email, and message.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSending(true);
    try {
      await submitContactForm({
        name,
        email,
        organisation: String(form.get("org") ?? ""),
        role: String(form.get("role") ?? ""),
        message,
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send. Please email info@tailorediq.ai directly.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="marketing-shell flex min-h-screen flex-col bg-background">
      <Navigation />

      <section className="container-tight grid gap-16 pb-16 pt-20 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <span className="eyebrow">Get in touch</span>
          <h1 className="mt-6 text-5xl md:text-6xl">
            Let&apos;s <span className="gradient-text-gold italic">talk.</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Whether you&rsquo;re a user seeking expert advice or an experienced operator eager to
            share your knowledge, we&rsquo;d love to hear from you.
          </p>

          <div className="mt-10">
            <div className="flex items-start gap-3">
              <Mail className="mt-1 size-4.5 text-gold" aria-hidden />
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div>info@tailorediq.ai</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="card-panel p-8 md:p-10">
            {submitted ? (
              <div className="py-12 text-center">
                <div className="mb-3 font-display text-3xl text-gold">Thank you.</div>
                <p className="text-muted-foreground">
                  We&apos;ve received your message and will be in touch shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Name" name="name" />
                  <Field label="Email" name="email" type="email" />
                </div>
                <Field label="Organisation" name="org" />
                <div>
                  <label
                    htmlFor="contact-role"
                    className="mb-2 block text-xs font-bold tracking-wide text-muted-foreground"
                  >
                    I&apos;m interested as
                  </label>
                  <select
                    id="contact-role"
                    name="role"
                    className="w-full rounded-lg border border-border bg-input/40 px-4 py-3 text-sm focus:border-gold focus:outline-none"
                  >
                    <option>A user seeking expertise</option>
                    <option>An expert wanting to join</option>
                    <option>A partner or collaborator</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-2 block text-xs font-bold tracking-wide text-muted-foreground"
                  >
                    What&apos;s on your mind
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    className="w-full resize-none rounded-lg border border-border bg-input/40 px-4 py-3 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button type="submit" disabled={sending} className="btn-primary w-full md:w-auto">
                  {sending ? "Sending…" : "Send message"}{" "}
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Field({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return (
    <div>
      <label
        htmlFor={`contact-${name}`}
        className="mb-2 block text-xs font-bold tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={`contact-${name}`}
        type={type}
        name={name}
        className="w-full rounded-lg border border-border bg-input/40 px-4 py-3 text-sm focus:border-gold focus:outline-none"
      />
    </div>
  );
}
