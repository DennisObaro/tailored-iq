"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  Briefcase,
  Calendar,
  ClipboardList,
  FileText,
  MessageSquare,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Consultation, NotificationType, Project } from "@/lib/types";
import { useSessionStore } from "@/lib/store/use-session-store";
import * as projectsApi from "@/lib/api/projects";
import * as notificationsApi from "@/lib/api/notifications";
import * as consultationsApi from "@/lib/api/consultations";
import * as playbooksApi from "@/lib/api/playbooks";
import * as expertsApi from "@/lib/api/experts";
import type { ExpertListing, RecommendedExpertsResult } from "@/lib/api/experts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { ProjectCard } from "@/components/project/project-card";
import { ExpertCard } from "@/components/expert/expert-card";
import { formatCallWhen, isCallImminent } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface ActionItem {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}

interface UpcomingCall {
  consultation: Consultation;
  expert: ExpertListing;
}

const ACTION_ITEM_META: Partial<Record<NotificationType, { icon: LucideIcon; ctaLabel: string }>> = {
  report_ready: { icon: FileText, ctaLabel: "View report" },
  playbook_ready: { icon: ClipboardList, ctaLabel: "View action plan" },
  playbook_updated: { icon: ClipboardList, ctaLabel: "View update" },
  call_reminder: { icon: Calendar, ctaLabel: "View call" },
  booking_confirmed: { icon: Calendar, ctaLabel: "View call" },
  contribution_added: { icon: MessageSquare, ctaLabel: "Review response" },
};

const SUGGESTED_PROMPTS = [
  { icon: Store, prompt: "Entering a new market" },
  { icon: Users, prompt: "Building a stronger leadership team" },
  { icon: Briefcase, prompt: "Hiring and retaining top talent" },
];

const HOW_IT_WORKS = [
  {
    number: "01",
    title: "We understand your challenge",
    description: "TailoredIQ asks the right questions to understand your situation and turn it into a clear brief.",
  },
  {
    number: "02",
    title: "Get clarity on your options",
    description: "Receive a concise assessment highlighting key considerations and possible ways forward.",
  },
  {
    number: "03",
    title: "Go deeper",
    description: "Connect with relevant expert for deeper guidance or request a tailored playbook.",
  },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionItems, setActionItems] = useState<ActionItem[] | null>(null);
  const [upcomingCalls, setUpcomingCalls] = useState<UpcomingCall[] | null>(null);
  const [upcomingCallsCount, setUpcomingCallsCount] = useState<number | null>(null);
  const [expertsConsultedCount, setExpertsConsultedCount] = useState<number | null>(null);
  const [playbookReadyCount, setPlaybookReadyCount] = useState<number | null>(null);
  const [recommended, setRecommended] = useState<RecommendedExpertsResult | null>(null);

  useEffect(() => {
    if (!user) return;
    projectsApi.listProjects(user.id).then(setProjects);
  }, [user]);

  useEffect(() => {
    if (!user || !projects || projects.length === 0) return;
    let cancelled = false;

    notificationsApi.listNotifications(user.id).then((notifications) => {
      if (cancelled) return;
      const items = notifications
        .filter((n) => !n.read && ACTION_ITEM_META[n.type])
        .slice(0, 3)
        .map((n) => {
          const meta = ACTION_ITEM_META[n.type]!;
          return { id: n.id, icon: meta.icon, ctaLabel: meta.ctaLabel, title: n.title, description: n.body, href: n.linkHref };
        });
      setActionItems(items);
    });

    consultationsApi.listConsultationsForClient(user.id).then(async (consultations) => {
      const now = new Date().toISOString();
      const upcoming = consultations.filter((c) => c.status === "scheduled" && c.scheduledFor > now);
      const withExperts = await Promise.all(
        upcoming.slice(0, 2).map(async (consultation) => ({ consultation, expert: await expertsApi.getExpert(consultation.expertId) })),
      );
      if (!cancelled) {
        setUpcomingCalls(withExperts.filter((c): c is UpcomingCall => c.expert !== null));
        setUpcomingCallsCount(upcoming.length);
        const consultedExpertIds = new Set(consultations.filter((c) => c.status === "completed").map((c) => c.expertId));
        setExpertsConsultedCount(consultedExpertIds.size);
      }
    });

    playbooksApi.listPlaybooks(user.id).then((playbooks) => {
      if (!cancelled) setPlaybookReadyCount(playbooks.filter((p) => p.status === "ready").length);
    });

    expertsApi.getRecommendedExperts(user.id).then((result) => {
      if (!cancelled) setRecommended(result);
    });

    return () => {
      cancelled = true;
    };
  }, [user, projects]);

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
      <div className="mx-auto flex h-full max-w-4xl flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl font-semibold">
          <span className="text-gray-50">{greeting()}, </span>
          <span className="text-gray-400">{user.firstName}</span>
        </h1>
        <p className="mt-3 max-w-md text-sm leading-[1.4] text-gray-400">
          Tell us what&apos;s on your mind. TailoredIQ will help you clarify the challenge, explore your
          options, and decide what to do next.
        </p>

        <div className="mt-10 w-full max-w-3xl">
          <div className="relative min-h-32 w-full rounded-[28px] bg-gray-950 px-6 pt-6 pb-14 focus-within:ring-2 focus-within:ring-primary-500">
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
              rows={1}
              disabled={submitting}
              className="w-full resize-none bg-transparent text-left text-sm italic text-gray-50 placeholder:italic placeholder:text-gray-400 focus-visible:outline-none disabled:opacity-50"
            />
            <Button
              size="icon"
              className="absolute bottom-3 right-4 h-8 w-8 rounded-full"
              loading={submitting}
              disabled={!value.trim()}
              onClick={() => start(value)}
              aria-label="Start a challenge"
            >
              <ArrowUp className="size-4" aria-hidden />
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-nowrap justify-center gap-2.5">
          {SUGGESTED_PROMPTS.map(({ icon: Icon, prompt }) => (
            <button
              key={prompt}
              onClick={() => start(prompt)}
              disabled={submitting}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-gray-800 px-3.5 py-2.5 text-sm text-gray-300 hover:border-gray-700 hover:bg-gray-900 disabled:opacity-50"
            >
              <Icon className="size-[22px] text-gray-500" aria-hidden />
              {prompt}
            </button>
          ))}
        </div>

        <div className="mt-6 grid w-full max-w-3xl grid-cols-1 gap-6 rounded-[28px] border border-gray-800 p-5 text-left sm:grid-cols-3 sm:divide-x sm:divide-gray-800">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.number} className="sm:px-5 sm:first:pl-0 sm:last:pr-0">
              <p className="text-xl font-medium text-gray-500">{step.number}</p>
              <p className="mt-2.5 text-sm font-medium text-gray-50">{step.title}</p>
              <p className="mt-1.5 text-sm text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeProjects = projects.filter((p) => !["completed", "archived"].includes(p.status));
  const displayedProjects = (activeProjects.length > 0 ? activeProjects : projects).slice(0, 2);
  const hasRecommended = recommended !== null && recommended.recommendations.length > 0;

  const metrics: { value: number | null; label: string; supporting: string; zeroSupporting: string; href: string }[] = [
    {
      value: activeProjects.length,
      label: "Active challenges",
      supporting: "Currently being worked on",
      zeroSupporting: "Start a new challenge",
      href: "/projects",
    },
    {
      value: playbookReadyCount,
      label: "Playbooks ready",
      supporting: "Ready for you to review",
      zeroSupporting: "Nothing waiting for review",
      href: "/playbooks",
    },
    {
      value: upcomingCallsCount,
      label: "Upcoming calls",
      supporting: "With your experts",
      zeroSupporting: "No calls scheduled",
      href: "/conversations",
    },
    {
      value: expertsConsultedCount,
      label: "Experts consulted",
      supporting: "Across your challenges",
      zeroSupporting: "Your expert conversations will appear here",
      href: "/experts",
    },
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-50">
            {greeting()}, {user.firstName}
          </h1>
          <p className="mt-1 text-sm text-gray-400">Continue where you left off or bring us a new challenge.</p>
        </div>
        <Button asChild className="gap-1.5">
          <Link href="/chat">
            Bring a new challenge <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((metric) => (
          <Link key={metric.label} href={metric.href} className="h-full">
            <Card className="flex h-full flex-col border-gray-900 bg-gray-950 p-4 transition-colors hover:bg-gray-900">
              {metric.value === null ? (
                <Skeleton className="h-8 w-10" />
              ) : (
                <p className="text-2xl font-semibold text-gray-50">{metric.value}</p>
              )}
              <p className="mt-1.5 text-xs font-medium text-gray-300">{metric.label}</p>
              {metric.value === null ? (
                <Skeleton className="mt-1 h-3 w-24" />
              ) : (
                <p className="mt-0.5 text-xs text-gray-500">{metric.value > 0 ? metric.supporting : metric.zeroSupporting}</p>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {(() => {
        const yourChallengesSection = (
          <section key="challenges">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 className="text-sm font-medium text-gray-300">Your challenges</h2>
                <p className="mt-1 text-xs text-gray-500">Continue working through the challenges you&apos;re solving.</p>
              </div>
              <Link href="/projects" className="inline-flex shrink-0 items-center gap-1 text-xs text-primary-400 hover:text-primary-300">
                View all <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className={cn("grid gap-3", displayedProjects.length > 1 && "sm:grid-cols-2")}>
              {displayedProjects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </section>
        );

        const actionRequiredSection = (
          <section key="action">
            <h2 className="text-sm font-medium text-gray-300">Action required</h2>
            <p className="mt-1 text-xs text-gray-500">Things that need your attention.</p>
            <div className="mt-3 space-y-2">
              {actionItems === null ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : actionItems.length > 0 ? (
                actionItems.map((item) => (
                  <Card key={item.id} className="flex items-center gap-3 border-gray-900 bg-gray-950 p-3.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-500/15 text-primary-400">
                      <item.icon className="size-4" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-50">{item.title}</p>
                      <p className="truncate text-xs text-gray-400">{item.description}</p>
                    </div>
                    <Link
                      href={item.href}
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary-400 hover:text-primary-300"
                    >
                      {item.ctaLabel} <ArrowRight className="size-3" />
                    </Link>
                  </Card>
                ))
              ) : (
                <div className="rounded-2xl border border-gray-900 px-4 py-3">
                  <p className="text-sm text-gray-300">You&apos;re all caught up.</p>
                  <p className="mt-0.5 text-xs text-gray-500">Nothing needs your attention right now.</p>
                </div>
              )}
            </div>
          </section>
        );

        const upcomingCallsSection = (
          <section key="calls">
            <h2 className="text-sm font-medium text-gray-300">Upcoming calls</h2>
            <p className="mt-1 text-xs text-gray-500">Your scheduled conversations with experts.</p>
            <div className="mt-3">
              {upcomingCalls === null ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : upcomingCalls.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {upcomingCalls.map(({ consultation, expert }) => (
                    <Card key={consultation.id} className="flex items-center gap-3 border-gray-900 bg-gray-950 p-4">
                      <Avatar
                        firstName={expert.user.firstName}
                        lastName={expert.user.lastName}
                        src={expert.user.avatarUrl}
                        online={expert.profile.isOnline}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-50">
                          {expert.user.firstName} {expert.user.lastName}
                        </p>
                        <p className="truncate text-xs text-gray-400">{expert.profile.currentRole}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="text-xs text-gray-500">{formatCallWhen(consultation.scheduledFor)}</p>
                          <StatusBadge status={consultation.status} />
                        </div>
                      </div>
                      <Button asChild size="sm" variant={isCallImminent(consultation.scheduledFor) ? "primary" : "outline"} className="shrink-0">
                        <Link href={`/consultations/${consultation.id}`}>
                          {isCallImminent(consultation.scheduledFor) ? "Join call" : "View details"}
                        </Link>
                      </Button>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-900 px-4 py-3">
                  <p className="text-sm text-gray-300">No upcoming calls</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Need another perspective? Explore experts with experience relevant to the challenges you&apos;re working through.
                  </p>
                  <Link
                    href="/experts"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-400 hover:text-primary-300"
                  >
                    Explore experts <ArrowRight className="size-3" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        );

        const expertsSection = hasRecommended && recommended ? (
          <section key="experts">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 className="text-sm font-medium text-gray-300">Experts relevant to you</h2>
                <p className="mt-1 text-xs text-gray-500">
                  {recommended.hasChats ? "Based on what you've been working on." : "Based on your profile."}
                </p>
              </div>
              <Link href="/experts" className="inline-flex shrink-0 items-center gap-1 text-xs text-primary-400 hover:text-primary-300">
                Explore all experts <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recommended.recommendations.map((r) => (
                <ExpertCard key={r.listing.user.id} listing={r.listing} reason={r.reason} truncateReason />
              ))}
            </div>
          </section>
        ) : null;

        // Baseline priority is action required, your challenges, upcoming calls,
        // experts — but a section with nothing in it (still-loading sections are
        // left alone) drops behind whatever does have content, so e.g. recommended
        // experts float up to fill the gap left by an empty "action required".
        const orderedSections = [
          { node: actionRequiredSection, empty: actionItems !== null && actionItems.length === 0 },
          { node: yourChallengesSection, empty: false },
          { node: upcomingCallsSection, empty: upcomingCalls !== null && upcomingCalls.length === 0 },
          ...(expertsSection ? [{ node: expertsSection, empty: false }] : []),
        ].sort((a, b) => Number(a.empty) - Number(b.empty));

        return orderedSections.map((s) => s.node);
      })()}
    </div>
  );
}
