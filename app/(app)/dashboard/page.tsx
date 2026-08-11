"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import type { Project } from "@/lib/types";
import { useSessionStore } from "@/lib/store/use-session-store";
import * as projectsApi from "@/lib/api/projects";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCard } from "@/components/project/project-card";

const SUGGESTED_PROMPTS = [
  "Entering a new market",
  "Building a stronger leadership team",
  "Hiring and retaining top talent",
  "Scaling operations",
  "Preparing for a major decision",
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    projectsApi.listProjects(user.id).then(setProjects);
  }, [user]);

  async function start(challenge: string) {
    if (!user || !challenge.trim() || submitting) return;
    setSubmitting(true);
    const { project } = await projectsApi.createProject(user.id, challenge.trim());
    router.push(`/chat/${project.id}`);
  }

  if (!user || !projects) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const isNewUser = projects.length === 0;

  if (isNewUser) {
    return (
      <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary-500/15 text-primary-400">
          <Sparkles className="size-5" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold text-gray-50">What are you trying to solve?</h1>
        <p className="mt-2 max-w-md text-sm text-gray-400">
          TailoredIQ will ask the right questions, clarify your situation, and help you find
          relevant experience.
        </p>

        <div className="mt-8 w-full">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                start(value);
              }
            }}
            placeholder="Describe your business challenge..."
            rows={4}
            disabled={submitting}
            className="w-full resize-none rounded-lg border border-gray-800 bg-gray-900 p-4 text-sm text-gray-50 placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          />
          <div className="mt-3 flex justify-end">
            <Button size="lg" loading={submitting} disabled={!value.trim()} onClick={() => start(value)}>
              Start a challenge
            </Button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => start(prompt)}
              disabled={submitting}
              className="rounded-full border border-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:border-gray-700 hover:bg-gray-900 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const activeProjects = projects.filter((p) => !["completed", "archived"].includes(p.status));

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-50">
            {greeting()}, {user.firstName}
          </h1>
          <p className="mt-1 text-sm text-gray-400">Continue where you left off or bring us a new challenge.</p>
        </div>
        <Button asChild className="gap-1.5">
          <Link href="/chat">
            Start a new challenge <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-300">Active projects</h2>
          <Link href="/projects" className="text-xs text-primary-400 hover:text-primary-300">
            View all
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(activeProjects.length > 0 ? activeProjects : projects).slice(0, 4).map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
