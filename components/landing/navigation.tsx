"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeftRight, BookOpen, LogOut, Menu, MessagesSquare, Settings, X } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useSessionStore } from "@/lib/store/use-session-store";
import { useHydrated } from "@/hooks/use-hydrated";

/**
 * Marketing-site header. Ported from the landing-page project's
 * components/Navigation.tsx.
 *
 * Two things changed beyond the mechanical TanStack -> Next.js swap:
 *
 * - Auth comes from this app's `useSessionStore` (localStorage-backed, see
 *   lib/store/use-session-store.ts) rather than the source project's
 *   `useAuth` + a `getMyProfile` server function. The source read
 *   `active_persona` off a fetched profile; here the equivalent already
 *   lives on the session user as `activeRole`, so there's no query at all.
 * - Its link targets were rewritten to this app's routes (see LINKS below).
 *   The source project's `/signup`, `/login`, `/expert-directory`,
 *   `/contribute` and `/onboarding/expert` don't exist here.
 *
 * The brand lockup reuses this app's existing `Logo` rather than the source
 * project's `BrandMark`: both are the same Figma mark (the identical
 * #dfb931/#f7cc31 gold badge), so porting BrandMark would have added a
 * second component drawing the same thing.
 */

/** Anchors live on the home page, so they're rendered as plain <a>.
 *
 *  "Experts" points at the public /for-experts recruitment page here, but at
 *  the real /experts directory in the signed-in link sets below. The directory
 *  lives inside the authenticated (app) group, so aiming a logged-out visitor
 *  at it would only bounce them to /sign-in. */
const PUBLIC_LINKS = [
  { href: "/#how-it-works", label: "How it works", hash: true },
  { href: "/about", label: "About" },
  { href: "/#testimonials", label: "Testimonials", hash: true },
  { href: "/for-experts", label: "Experts" },
] as const;

const CLIENT_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/experts", label: "Experts" },
] as const;

const EXPERT_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/expert/dashboard", label: "Dashboard" },
  { href: "/expert/contributions", label: "Contribute" },
  { href: "/experts", label: "Experts" },
] as const;

export function Navigation({ heroEntrance = false }: { heroEntrance?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const hydrated = useHydrated();
  const { user, status, init, signOut, switchRole } = useSessionStore();
  // The marketing pages sit outside the (app) route group, so nothing else
  // has initialised the session by the time this renders.
  useEffect(() => {
    if (hydrated) init();
  }, [hydrated, init]);

  // Signed-in chrome only renders once the store has actually resolved, so
  // the server-rendered (signed-out) markup is what hydrates.
  const signedIn = hydrated && status === "ready" && !!user;
  const isExpertView = signedIn && user.activeRole === "expert";
  const hasExpertRole = signedIn && user.roles.includes("expert");
  const initial = signedIn ? (user.firstName[0] ?? user.email[0] ?? "?").toUpperCase() : "?";

  // The header keeps its `animation` shorthand forever once .hero-anim-fade
  // applies (fill-mode "both" holds the end state rather than detaching the
  // property). A permanently-animating ancestor silently breaks the nav
  // pill's backdrop-filter after scroll — computed style still reports
  // blur(Npx) while nothing renders — even with the isolate/translateZ(0)
  // layer-promotion trick on the pill itself. Dropping the class once the
  // entrance actually finishes lets the blur render normally again.
  const [entranceDone, setEntranceDone] = useState(!heroEntrance);

  // Transparent at rest, frosted past 10px of scroll — see .nav-pill /
  // .nav-scrolled in globals.css. Toggled straight on the DOM node via a
  // rAF-throttled listener, since scroll fires far more often than this
  // component needs to re-render.
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    let ticking = false;
    const apply = () => {
      ticking = false;
      el.classList.toggle("nav-scrolled", window.scrollY > 10);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The header's real rendered height (which grows when it wraps, or when
  // the mobile menu is open) drives scroll-margin-top on the anchor targets,
  // so a hash jump never lands with its heading hidden under the nav.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const setNavHeightVar = () => {
      document.documentElement.style.setProperty("--nav-height", `${el.offsetHeight}px`);
    };
    setNavHeightVar();
    const ro = new ResizeObserver(setNavHeightVar);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  // Marketing links and the Sign in / Get Started CTAs are both redundant on
  // the auth pages themselves — you're already mid-flow there.
  const isAuthPage = pathname === "/sign-in" || pathname === "/sign-up";

  const visibleLinks = signedIn ? (isExpertView ? EXPERT_LINKS : CLIENT_LINKS) : PUBLIC_LINKS;

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onSignOut = async () => {
    setOpen(false);
    await signOut();
    router.push("/");
  };

  const onSwitchRole = async () => {
    await switchRole(isExpertView ? "client" : "expert");
    router.push(isExpertView ? "/dashboard" : "/expert/dashboard");
  };

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 px-4 pt-4 md:px-6 md:pt-5 ${
        heroEntrance && !entranceDone ? "hero-anim-fade" : ""
      }`}
      style={heroEntrance ? ({ "--hero-delay": "0ms" } as CSSProperties) : undefined}
      onAnimationEnd={(e) => {
        if (e.animationName === "hero-fade-in") setEntranceDone(true);
      }}
    >
      {/* isolate + translateZ(0) forces the pill onto its own compositing
          layer. Without it Safari has a long-standing bug where
          backdrop-filter silently falls back to no blur when an ancestor —
          here the header, which carries a permanent `animation` property
          from .hero-anim-fade — is itself composited separately. */}
      <nav
        ref={navRef}
        className="nav-pill relative z-10 mx-auto flex w-fit max-w-full items-center gap-8 rounded-[100px] py-2.5 pl-5 pr-3 isolate [transform:translateZ(0)] lg:gap-[228px]"
      >
        <Link href="/" className="group flex shrink-0 items-center gap-[9px]">
          <Logo />
        </Link>

        {!isAuthPage && (
          <div className="hidden shrink-0 items-center gap-10 md:flex">
            {visibleLinks.map((l) =>
              "hash" in l && l.hash ? (
                <a
                  key={l.label}
                  href={l.href}
                  className="whitespace-nowrap text-base font-medium text-mkt-text-soft transition-colors hover:text-mkt-text"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.label}
                  href={l.href}
                  className={`whitespace-nowrap text-base font-medium transition-colors hover:text-mkt-text ${
                    pathname === l.href ? "text-mkt-text" : "text-mkt-text-soft"
                  }`}
                >
                  {l.label}
                </Link>
              ),
            )}
          </div>
        )}

        <div className="hidden shrink-0 items-center gap-[26px] md:flex">
          {signedIn ? (
            <>
              <ThemeToggle className="-mr-2 text-mkt-text-mute hover:bg-gray-850 hover:text-mkt-text" />
              <DropdownMenu>
              <DropdownMenuTrigger className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gold text-base font-bold text-primary-foreground hover:opacity-90">
                {initial}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="nav-popover-shadow w-56 shadow-none">
                <div className="truncate px-2 py-1.5 text-xs text-muted-foreground">
                  {user.email}
                </div>
                <DropdownMenuSeparator />
                {!isExpertView && (
                  <DropdownMenuItem onClick={() => go("/playbooks")}>
                    <BookOpen className="mr-2 size-3.5" aria-hidden /> My playbooks
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => go("/conversations")}>
                  <MessagesSquare className="mr-2 size-3.5" aria-hidden /> My conversations
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go(isExpertView ? "/expert/profile" : "/settings")}>
                  <Settings className="mr-2 size-3.5" aria-hidden />{" "}
                  {isExpertView ? "Profile" : "Settings"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {hasExpertRole ? (
                  <DropdownMenuItem onClick={onSwitchRole}>
                    <ArrowLeftRight className="mr-2 size-3.5" aria-hidden />
                    Switch to {isExpertView ? "client" : "expert"} view
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => go("/become-an-expert")}>
                    <ArrowLeftRight className="mr-2 size-3.5" aria-hidden /> Become an expert
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut}>
                  <LogOut className="mr-2 size-3.5" aria-hidden /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            !isAuthPage && (
              <>
                <ThemeToggle className="-mr-2 text-mkt-text-mute hover:bg-gray-850 hover:text-mkt-text" />
                <Link
                  href="/sign-in"
                  className="text-base font-medium text-mkt-text-soft hover:text-mkt-text"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-mkt-cta px-[14px] py-[8px] text-[18px] font-semibold text-mkt-cta-ink transition-colors hover:bg-mkt-cta/90"
                >
                  Get Started
                </Link>
              </>
            )
          )}
        </div>

        <button
          className="ml-auto text-foreground md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
        </button>
      </nav>

      {open && (
        <div className="relative z-10 mx-auto mt-2 max-w-[1240px] rounded-[24px] border border-border bg-gray-975 md:hidden">
          <div className="flex flex-col gap-3 px-6 py-4">
            {visibleLinks.map((l) =>
              "hash" in l && l.hash ? (
                <a
                  key={l.label}
                  href={l.href}
                  className="py-2 text-base text-muted-foreground"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.label}
                  href={l.href}
                  className="py-2 text-base text-muted-foreground"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ),
            )}
            {signedIn ? (
              <button onClick={onSignOut} className="btn-ghost mt-2 self-start">
                Sign out
              </button>
            ) : (
              !isAuthPage && (
                <>
                  <Link href="/sign-in" onClick={() => setOpen(false)} className="py-2 text-base">
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setOpen(false)}
                    className="btn-primary mt-2 self-start"
                  >
                    Get Started
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
}
