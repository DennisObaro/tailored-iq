"use client";

import Link from "next/link";
import { ArrowRight, Lock } from "@/components/icons";
import { Navigation } from "@/components/landing/navigation";
import { Footer } from "@/components/landing/footer";
import { useSessionStore } from "@/lib/store/use-session-store";
import { useHydrated } from "@/hooks/use-hydrated";

/**
 * Ported from the landing-page project's routes/about.tsx. The page body is
 * unchanged; the route wrapper became app/about/page.tsx (which owns the
 * metadata the source declared through TanStack's `head()`), and the
 * signed-in check moved from `useAuth` to this app's session store.
 *
 * It stays a client component because the network section below is gated on
 * that check — everything else on the page is static.
 */

const experts = [
  {
    name: "Elizabeth Okonji",
    role: "Founder, TGL Labs · Fractional CPO",
    img: "/landing/founder-elizabeth.jpg",
  },
  { name: "Amara Osei", role: "Former CFO, Flour Mills Nigeria · Board Advisor", img: undefined },
  { name: "Thabo Mbeki", role: "Ex-CEO, Safaricom Enterprise · Strategy Advisor", img: undefined },
  { name: "Ngozi Adichie", role: "CPO, Andela · Product & Growth Advisor", img: undefined },
  { name: "Kofi Asante", role: "Former MD, Goldman Sachs Lagos · Capital Markets", img: undefined },
  { name: "Fatima Bello", role: "CEO, Ventures Platform · Startup Ecosystem", img: undefined },
  { name: "Jean-Pierre Ndaye", role: "Ex-COO, Jumia Central Africa · Operations", img: undefined },
];

const steps = [
  {
    n: "01",
    title: "Share your need",
    body: "Tell us the challenge, decision or project where outside experience would sharpen the call.",
  },
  {
    n: "02",
    title: "Get matched thoughtfully",
    body: "We curate relevant operators from the network around your context, sector, and decision.",
  },
  {
    n: "03",
    title: "Engage directly",
    body: "Connect through advisory conversations, structured project support, or longer-term expert engagements.",
  },
];

const values = [
  {
    t: "Curated quality over volume",
    b: "Every expert in the network is personally vetted. We grow slowly, on purpose.",
  },
  {
    t: "Practical and contextual",
    b: "Insight grounded in real operating experience inside the markets where you compete.",
  },
  {
    t: "Discretion by design",
    b: "Confidential conversations between peers. What's shared in the network stays in the network.",
  },
  {
    t: "Built for African contexts",
    b: "We understand the regulation, capital, talent and culture realities of these markets.",
  },
];

const philosophy = [
  {
    title: "Experience is capital",
    body: "Insight earned from navigating complex markets, building teams, and making hard calls is its own form of capital — and should be as accessible as any financial resource.",
  },
  {
    title: "Context over generics",
    body: "African markets are not smaller versions of Western ones. They have their own rhythms, risks, and rewards. Advice that ignores that context is worse than no advice at all.",
  },
  {
    title: "Trust is the network",
    body: "Every connection in TailoredIQ is built on personal vetting and mutual respect. We don't scale by lowering the bar — we hold it high and widen the circle carefully.",
  },
];

export function AboutContent() {
  const hydrated = useHydrated();
  const user = useSessionStore((s) => s.user);
  const isLoggedIn = hydrated && !!user;

  return (
    <div className="marketing-shell flex min-h-screen flex-col bg-background">
      <Navigation />

      <section className="container-tight pb-16 pt-20">
        <span className="eyebrow">About TailoredIQ</span>
        <h1 className="mt-6 max-w-3xl text-balance pb-2 text-[54px] font-semibold leading-[1.2] tracking-normal">
          The wisdom of lived experience, made accessible.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          TailoredIQ exists because the most valuable insight rarely comes from theory or technology
          alone. It comes from people who have led organisations, built teams, and navigated complex
          decisions — often in markets that don&apos;t fit the textbook.
        </p>
      </section>

      <section className="container-tight grid gap-12 py-16 md:grid-cols-2">
        {values.map((v) => (
          <div key={v.t} className="card-panel p-8">
            <h3 className="mb-3 text-2xl">{v.t}</h3>
            <p className="text-lg leading-relaxed text-muted-foreground [text-wrap:pretty]">
              {v.b}
            </p>
          </div>
        ))}
      </section>

      {/* HOW IT WORKS */}
      <section className="container-tight py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow">How it works</span>
          <h2 className="mt-4 text-balance text-[54px] font-semibold leading-[1.2] tracking-normal">
            A thoughtful match, not a marketplace
          </h2>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative text-center">
              <div className="font-display text-7xl text-gold/60">{s.n}</div>
              <h3 className="mt-2 text-2xl">{s.title}</h3>
              <p className="mt-3 text-lg leading-relaxed text-muted-foreground [text-wrap:pretty]">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* THE NETWORK — logged-out visitors only; signed-in users reach this
          through the Experts nav tab instead. */}
      {!isLoggedIn && (
        <section className="bg-surface">
          <div className="container-tight py-24 md:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <span className="eyebrow">The Network</span>
              <h2 className="mt-4 text-balance text-[54px] font-semibold leading-[1.2] tracking-normal">
                The people behind the titles
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Senior operators from 30+ African markets and the diaspora — founders, CEOs, CPOs,
                CFOs, board advisors. Each personally vetted before joining.
              </p>
            </div>

            <div className="relative mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {experts.map((e, i) => (
                <div
                  key={e.name}
                  className={`card-panel group p-5 transition-colors hover:border-gold/60 ${
                    i > 0 ? "pointer-events-none select-none opacity-60 blur-[6px]" : ""
                  }`}
                >
                  <div className="mb-4 aspect-square overflow-hidden rounded-lg border border-border bg-secondary">
                    {e.img ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={e.img}
                        alt={e.name}
                        width={400}
                        height={400}
                        loading="lazy"
                        className="h-full w-full object-cover grayscale-[20%] transition-all group-hover:grayscale-0"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display text-5xl text-gold/40">
                        {e.name
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                    )}
                  </div>
                  <h4 className="font-display text-base">{e.name}</h4>
                  <p className="mt-1 text-base text-muted-foreground">{e.role}</p>
                </div>
              ))}

              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="card-panel max-w-sm bg-background/90 p-8 text-center backdrop-blur-sm">
                  <Lock className="mx-auto mb-4 size-8 text-gold" aria-hidden />
                  <h3 className="mb-2 font-display text-xl">Join to see the network</h3>
                  <p className="mb-6 text-lg text-muted-foreground">
                    Members get full access to our curated community of senior operators across 30+
                    African markets.
                  </p>
                  <Link href="/sign-up" className="btn-primary inline-flex w-full justify-center">
                    Join TailoredIQ <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PHILOSOPHY */}
      <section>
        <div className="container-tight py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow">The TailoredIQ Philosophy</span>
            <h2 className="mt-4 text-balance text-[54px] font-semibold leading-[1.2] tracking-normal">
              Insight is context
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              We believe the best decisions are made by people who have lived the problem — not just
              studied it. Our philosophy is simple: match the right experience to the right moment,
              and trust the people who have done the work before to guide those doing it now.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {philosophy.map((item) => (
              <div
                key={item.title}
                className="card-panel group p-8 transition-colors hover:border-gold/60"
              >
                <h3 className="mb-3 text-2xl">{item.title}</h3>
                <p className="text-lg leading-relaxed text-muted-foreground [text-wrap:pretty]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
