import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-975">
      <header className="flex items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Create account</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-primary-400">
          Experience Capital
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-gray-50 sm:text-5xl">
          Bring us the challenge.
          <br />
          We&apos;ll help you find the path forward.
        </h1>
        <p className="mt-5 max-w-lg text-base text-gray-400">
          TailoredIQ combines AI-assisted problem diagnosis with real professional
          experience — turning your business challenge into a practical plan.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Button asChild size="lg">
            <Link href="/sign-up" className="gap-2">
              Start a challenge <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
        <p className="mt-6 text-sm text-gray-400">
          Have experience worth sharing?{" "}
          <Link href="/become-an-expert" className="font-medium text-primary-400 hover:text-primary-300">
            Become an expert
          </Link>
        </p>
      </main>

      <footer className="px-6 py-6 text-center text-xs text-gray-600">
        Challenge &rarr; AI diagnosis &rarr; Structured brief &rarr; Relevant experts &rarr; Playbook &rarr; Action
      </footer>
    </div>
  );
}
