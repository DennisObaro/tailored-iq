"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Ported from the landing-page project's routes/privacy.tsx. The legal copy is
 * carried over verbatim.
 *
 * The source presented this as a modal over whatever page you came from, and
 * that's preserved: closing it goes back in history, or falls back to the
 * home page when this URL was opened directly (a fresh tab, or a link from
 * outside the site), which the source's own `history.length` check did too.
 */

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 font-display text-xl md:text-2xl">
        <span className="mr-2 text-gold">{n}.</span>
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export function PrivacyContent() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    // Let the close animation run before navigating away.
    setTimeout(() => {
      if (window.history.length > 1) router.back();
      else router.push("/");
    }, 150);
  };

  return (
    <div className="marketing-shell">
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) handleClose();
        }}
      >
        <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden p-0">
          <DialogHeader className="border-b border-border px-6 pb-4 pt-6 text-left md:px-8">
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Legal</p>
            <DialogTitle className="font-display text-2xl leading-tight md:text-3xl">
              Privacy Policy
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Last updated: December 25, 2025 · Effective: December 30, 2025
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto px-6 md:px-8 py-6">
            <Section n="1" title="Introduction">
              <p>
                TailoredIQ (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates a curated expert network connecting users with
                seasoned operators across African and diaspora markets. This Privacy Policy explains
                what personal data we collect, how we use it, who we share it with, and the rights you
                have over it.
              </p>
              <p>
                By creating an account or using the platform, you acknowledge the practices described
                here. If you do not agree, please do not use TailoredIQ.
              </p>
            </Section>

            <Section n="2" title="Information We Collect">
              <p>We collect the following categories of personal data:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>
                  <span className="text-foreground font-medium">Account data</span> — name, email
                  address, password (hashed), role (member or expert).
                </li>
                <li>
                  <span className="text-foreground font-medium">Profile data</span> — areas of
                  expertise, biography, professional background, and any content you choose to upload.
                </li>
                <li>
                  <span className="text-foreground font-medium">Expert contributions</span> —
                  playbooks, frameworks, case studies, and other materials you submit to ground
                  answers.
                </li>
                <li>
                  <span className="text-foreground font-medium">Usage data</span> — questions asked,
                  threads created, citations viewed, and general interaction patterns.
                </li>
                <li>
                  <span className="text-foreground font-medium">Technical data</span> — IP address,
                  browser type, device identifiers, and log information collected automatically.
                </li>
              </ul>
            </Section>

            <Section n="3" title="How We Use Your Information">
              <p>We process personal data to:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Provide, operate, and maintain the platform and its features.</li>
                <li>
                  Match members&apos; questions to relevant expert knowledge and produce cited answers.
                </li>
                <li>Authenticate users and protect accounts.</li>
                <li>Improve the quality, safety, and relevance of responses.</li>
                <li>Communicate updates, security notices, and service-related information.</li>
                <li>Comply with legal obligations and enforce our Terms &amp; Conditions.</li>
              </ul>
            </Section>

            <Section n="4" title="Legal Basis for Processing">
              <p>
                Where applicable data protection laws (including GDPR-aligned principles) require a
                legal basis, we rely on:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>
                  <span className="text-foreground font-medium">Contract</span> — to deliver the
                  service you have signed up for.
                </li>
                <li>
                  <span className="text-foreground font-medium">Legitimate interests</span> — to
                  operate, secure, and improve the platform.
                </li>
                <li>
                  <span className="text-foreground font-medium">Consent</span> — for optional
                  communications and where required by law.
                </li>
                <li>
                  <span className="text-foreground font-medium">Legal obligation</span> — to comply
                  with applicable regulations.
                </li>
              </ul>
            </Section>

            <Section n="5" title="AI &amp; Expert Knowledge Use">
              <p>
                Expert contributions submitted to TailoredIQ are used to ground AI-generated answers
                for other members and are surfaced with attribution. Member questions may be processed
                by third-party AI providers under strict data-processing terms.
              </p>
              <p>
                We do not use your private questions or uploaded materials to train foundational
                third-party models, and we do not sell personal data.
              </p>
            </Section>

            <Section n="6" title="Sharing &amp; Disclosure">
              <p>We share personal data only with:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>
                  <span className="text-foreground font-medium">Service providers</span> — hosting,
                  authentication, analytics, and AI infrastructure partners bound by confidentiality
                  obligations.
                </li>
                <li>
                  <span className="text-foreground font-medium">Other users</span> — where you choose
                  to publish a profile or contribution; attribution is shown alongside cited answers.
                </li>
                <li>
                  <span className="text-foreground font-medium">
                    Legal &amp; regulatory authorities
                  </span>{" "}
                  — when required by law, court order, or to protect rights, safety, and the integrity
                  of the platform.
                </li>
                <li>
                  <span className="text-foreground font-medium">Successors</span> — in connection with
                  a merger, acquisition, or sale of assets, subject to equivalent protections.
                </li>
              </ul>
              <p>We do not sell personal data to advertisers or data brokers.</p>
            </Section>

            <Section n="7" title="International Transfers">
              <p>
                TailoredIQ operates across African and diaspora markets, and personal data may be
                processed in jurisdictions other than your own. Where data is transferred
                internationally, we rely on appropriate safeguards, including standard contractual
                clauses where required.
              </p>
            </Section>

            <Section n="8" title="Data Retention">
              <p>
                We retain personal data for as long as your account is active and for a reasonable
                period afterwards to comply with legal obligations, resolve disputes, and enforce
                agreements. Expert contributions may persist in cited form even after account closure,
                unless removal is specifically requested and legally permitted.
              </p>
            </Section>

            <Section n="9" title="Your Rights">
              <p>Subject to applicable law, you have the right to:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Access the personal data we hold about you.</li>
                <li>Request correction of inaccurate or incomplete data.</li>
                <li>Request deletion of your account and associated personal data.</li>
                <li>Object to or restrict certain processing activities.</li>
                <li>Request a portable copy of data you have provided.</li>
                <li>Withdraw consent where processing is based on consent.</li>
              </ul>
              <p>
                To exercise any of these rights, contact us at{" "}
                <span className="text-foreground">info@tailorediq.ai</span>. We will respond within
                the timeframes required by applicable law.
              </p>
            </Section>

            <Section n="10" title="Security">
              <p>
                We apply administrative, technical, and organisational safeguards designed to protect
                personal data against unauthorised access, alteration, disclosure, or destruction. No
                system is perfectly secure; you are responsible for maintaining the confidentiality of
                your account credentials.
              </p>
            </Section>

            <Section n="11" title="Cookies &amp; Similar Technologies">
              <p>
                We use cookies and similar technologies to keep you signed in, remember preferences,
                and understand how the platform is used. You can control cookies through your browser
                settings; disabling them may affect functionality.
              </p>
            </Section>

            <Section n="12" title="Children">
              <p>
                TailoredIQ is intended for professional use by adults. We do not knowingly collect
                personal data from individuals under 18. If you believe a minor has provided data,
                please contact us so we can remove it.
              </p>
            </Section>

            <Section n="13" title="Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. Material changes will be notified
                through the platform or by email. Continued use of TailoredIQ after the effective date
                constitutes acceptance of the revised policy.
              </p>
            </Section>

            <Section n="14" title="Contact Us">
              <p>
                For questions about this policy or our data practices, contact us at{" "}
                <span className="text-foreground">info@tailorediq.ai</span>.
              </p>
            </Section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
