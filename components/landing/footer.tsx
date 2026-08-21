import Link from "next/link";

/**
 * Marketing-site footer. Ported from the landing-page project's
 * components/Footer.tsx — TanStack `<Link to>` swapped for next/link
 * `<Link href>`, and the imported brand-icon asset now referenced from
 * public/landing/ rather than a bundler asset import.
 */
export function Footer() {
  return (
    <footer className="mt-32">
      <div className="container-tight grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/landing/brand-icon.png" alt="" className="h-7 w-7 object-contain" />
            <span className="font-display text-lg">
              Tailored<span className="text-gold">IQ</span>
            </span>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Africa&apos;s curated expert network. Connecting users with seasoned operators whose
            insight is grounded in real decision-making across African and diaspora markets.
          </p>
        </div>

        <div>
          <h4 className="mb-4 font-sans text-xs font-semibold tracking-wide text-gold">Explore</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <Link href="/about" className="hover:text-foreground">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-foreground">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-sans text-xs font-semibold tracking-wide text-gold">
            Get in touch
          </h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>info@tailorediq.ai</li>
          </ul>
        </div>
      </div>
      <div>
        <div className="container-tight flex flex-col gap-3 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>{`© ${new Date().getFullYear()} TailoredIQ, all rights reserved.`}</span>
            <Link href="/terms" className="hover:text-foreground">
              Terms &amp; Conditions
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
          <span>Experience Capital, reimagined.</span>
        </div>
      </div>
    </footer>
  );
}
