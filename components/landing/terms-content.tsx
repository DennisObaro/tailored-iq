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
 * Ported from the landing-page project's routes/terms.tsx. The legal copy is
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

export function TermsContent() {
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
              Expert Network Terms &amp; Conditions for Ethics and Compliance
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Last updated: December 25, 2025 · Effective: December 30, 2025
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto px-6 md:px-8 py-6">
            <Section n="1" title="Purpose of the TailoredIQ Expert Network">
              <p>
                TailoredIQ is a curated, peer-validated expert network designed to enable
                organizations, founders, and leaders to access high-integrity professional insight,
                experience-based judgment, and strategic guidance.
              </p>
              <p>
                TailoredIQ is not a marketplace for confidential information, proprietary data, or
                privileged insights. Participation is conditional on strict adherence to ethical
                conduct, confidentiality, and applicable laws.
              </p>
            </Section>

            <Section n="2" title="Eligibility & Representations">
              <p>By joining TailoredIQ, you confirm that:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>
                  You are participating in your personal capacity, not as a representative of your
                  current or former employer unless expressly authorised.
                </li>
                <li>
                  You are legally permitted to provide general professional insights and advice.
                </li>
                <li>
                  Your participation does not breach any contractual, fiduciary, or statutory
                  obligation.
                </li>
                <li>
                  All information you provide about your experience and credentials is accurate and
                  truthful.
                </li>
              </ul>
              <p>
                TailoredIQ reserves the right to approve, decline, suspend, or revoke expert
                membership at its sole discretion.
              </p>
            </Section>

            <Section n="3" title="Scope of Permissible Contributions">
              <p>Experts may provide:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>High-level professional judgment</li>
                <li>Experience-based insights</li>
                <li>Industry trends and best practices</li>
                <li>Strategic frameworks and non-confidential examples</li>
              </ul>
              <p>Experts must not provide:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Confidential or proprietary information</li>
                <li>Trade secrets, source code, algorithms, formulas, or unpublished research</li>
                <li>Material non-public information (MNPI)</li>
                <li>Internal documents, data, or client information</li>
                <li>Advice that requires regulated licensure unless explicitly permitted</li>
              </ul>
              <p className="italic">
                Rule of thumb: If the insight could not be shared at a professional conference or
                boardroom without permission, it should not be shared on TailoredIQ.
              </p>
            </Section>

            <Section n="4" title="Confidentiality Obligations">
              <h3 className="font-display text-base text-foreground">4.1 Expert Confidentiality</h3>
              <p>Experts must:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Protect all non-public information received through TailoredIQ</li>
                <li>Use such information solely for the purpose of the engagement</li>
                <li>Not disclose or reuse client information in any form</li>
              </ul>
              <h3 className="font-display text-base text-foreground">4.2 Client Confidentiality</h3>
              <p>Experts must never:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Identify or imply the identity of clients</li>
                <li>Share details of private advisory conversations</li>
                <li>Reference confidential engagements publicly or privately</li>
              </ul>
              <p>These obligations survive termination of participation.</p>
            </Section>

            <Section n="5" title="Conflicts of Interest">
              <p>Experts are required to:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Proactively disclose actual, potential, or perceived conflicts of interest</li>
                <li>Decline engagements where objectivity may be compromised</li>
                <li>Avoid advising direct competitors where conflicts exist</li>
                <li>
                  Not use TailoredIQ engagements to advance undisclosed personal, employer, or
                  investor interests
                </li>
              </ul>
              <p>TailoredIQ may:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Restrict certain engagements</li>
                <li>Require conflict disclosures</li>
                <li>Remove experts from specific categories or engagements</li>
              </ul>
            </Section>

            <Section n="6" title="Intellectual Property (IP)">
              <h3 className="font-display text-base text-foreground">6.1 Expert IP</h3>
              <p>Experts retain ownership of their pre-existing intellectual property.</p>
              <h3 className="font-display text-base text-foreground">6.2 Engagement Outputs</h3>
              <p>Unless otherwise agreed:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Insights shared are non-exclusive</li>
                <li>
                  Experts do not transfer ownership of proprietary tools, frameworks, or materials
                </li>
                <li>Experts must not deliver materials they do not have the right to share</li>
              </ul>
              <p>Experts warrant that their contributions do not infringe third-party IP rights.</p>
            </Section>

            <Section n="7" title="Prohibition of Information Trading & Market Abuse">
              <p>Experts must not:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Share or solicit MNPI</li>
                <li>Discuss unpublished financial results, deal terms, or strategic moves</li>
                <li>Enable insider trading, market manipulation, or regulatory breaches</li>
              </ul>
              <p>
                Experts acknowledge that TailoredIQ engagements may be monitored and audited to ensure
                compliance.
              </p>
            </Section>

            <Section n="8" title="Data Protection & Privacy">
              <p>
                TailoredIQ complies with applicable data protection laws, including principles aligned
                with GDPR and relevant local regulations.
              </p>
              <p>Experts agree that:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Personal data will be processed for platform operation, vetting, and matching</li>
                <li>Data will not be sold or misused</li>
                <li>
                  Experts must not collect, store, or reuse personal data obtained through TailoredIQ
                </li>
              </ul>
            </Section>

            <Section n="9" title="Communications & Record Keeping">
              <p>TailoredIQ may:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Require engagements to occur on approved channels</li>
                <li>Maintain records for compliance, quality, and dispute resolution</li>
                <li>Review interactions to ensure ethical conduct</li>
              </ul>
              <p>Unauthorized off-platform engagements are discouraged and may void protections.</p>
            </Section>

            <Section n="10" title="Ethics & Professional Conduct">
              <p>Experts must:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Act with integrity, independence, and professionalism</li>
                <li>Avoid misrepresentation or exaggeration of expertise</li>
                <li>Refrain from discriminatory, abusive, or unethical conduct</li>
                <li>Respect diversity, inclusion, and professional boundaries</li>
              </ul>
            </Section>

            <Section n="11" title="Enforcement & Sanctions">
              <p>Violations may result in:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Warnings or mandatory remediation</li>
                <li>Suspension or termination of membership</li>
                <li>Removal from specific engagements</li>
                <li>Legal action where necessary</li>
              </ul>
              <p>TailoredIQ&apos;s decisions are final.</p>
            </Section>

            <Section n="12" title="Limitation of Liability">
              <p>TailoredIQ:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Does not provide legal, financial, or regulatory advice</li>
                <li>Is not responsible for outcomes of expert engagements</li>
                <li>Makes no guarantees regarding engagements, income, or opportunities</li>
              </ul>
              <p>Experts participate at their own discretion.</p>
            </Section>

            <Section n="13" title="Governing Law">
              <p>
                These Terms are governed by the laws of Nigeria / Delaware, unless otherwise
                specified.
              </p>
            </Section>

            <Section n="14" title="Acceptance">
              <p>
                By joining or participating in TailoredIQ, you confirm that you have read, understood,
                and agreed to these Terms and Conditions.
              </p>
            </Section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
