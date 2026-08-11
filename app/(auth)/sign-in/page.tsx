"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useSessionStore } from "@/lib/store/use-session-store";
import * as authApi from "@/lib/api/auth";
import type { DemoPersona } from "@/lib/api/auth";

export default function SignInPage() {
  const router = useRouter();
  const signIn = useSessionStore((s) => s.signIn);
  const signInAsDemo = useSessionStore((s) => s.signInAsDemo);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoPersonas, setDemoPersonas] = useState<DemoPersona[]>([]);

  useEffect(() => {
    authApi.listDemoPersonas().then(setDemoPersonas);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting("form");
    try {
      const user = await signIn(email, password);
      router.push(user.activeRole === "expert" ? "/expert/dashboard" : "/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(null);
    }
  }

  async function onDemoSignIn(userId: string) {
    setError(null);
    setSubmitting(userId);
    try {
      const user = await signInAsDemo(userId);
      router.push(user.activeRole === "expert" ? "/expert/dashboard" : "/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold text-gray-50">Welcome back</h1>
        <p className="text-sm text-gray-400">Sign in to continue where you left off.</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-gray-400">
            <Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember me
          </label>
          <span className="text-gray-500">Forgot password?</span>
        </div>

        <FieldError>{error}</FieldError>

        <Button type="submit" size="lg" loading={submitting === "form"} className="w-full justify-center">
          Sign in
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-gray-600">
        <div className="h-px flex-1 bg-gray-800" />
        Quick demo access
        <div className="h-px flex-1 bg-gray-800" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {demoPersonas.map((p) => (
          <Button
            key={p.id}
            type="button"
            variant="outline"
            size="sm"
            loading={submitting === p.id}
            onClick={() => onDemoSignIn(p.id)}
            className="flex-col gap-0.5 h-auto py-2"
          >
            <span className="text-xs font-medium">{p.label}</span>
            <span className="text-[10px] text-gray-500">{p.sublabel}</span>
          </Button>
        ))}
      </div>

      <p className="text-center text-sm text-gray-400">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-medium text-primary-400 hover:text-primary-300">
          Create account
        </Link>
      </p>
    </div>
  );
}
