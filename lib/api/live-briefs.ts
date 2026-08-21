import type { ExpertBriefParticipation, Project } from "@/lib/types";
import { simulateNetwork, ApiError } from "./client";
import { db, type Database } from "./_db";
import { id } from "@/lib/utils/id";
import { abridgeQuestion } from "@/lib/ai-sim/brief-headline";
import { getExpertAccess } from "@/lib/utils/expert-access";
import { createPlaybookWithin } from "./playbooks";

/** How long a live brief stays at the top of an expert's dashboard. */
export const LIVE_BRIEF_TTL_MS = 5 * 60 * 1000;

/**
 * What an expert is shown about a brief they haven't accepted yet.
 *
 * Deliberately says nothing about who the client is — no name, no id, no
 * company. The challenge is the whole point; the identity isn't needed to
 * decide whether you can help, and everything past this (the structured
 * brief, the transcript) already sits behind `canViewProject`.
 */
export interface LiveBriefNotification {
  participation: ExpertBriefParticipation;
  projectId: string;
  /** The client's actual first question, cut to a line or two. */
  headline: string;
  /** The whole thing, revealed when the expert expands the banner. */
  fullQuestion: string;
  title: string;
  category?: string;
  /** How far the client has got since submitting — context, not identity. */
  stage: Project["status"];
  createdAt: string;
  expiresAt: string;
}

function listingFor(project: Project, participation: ExpertBriefParticipation): LiveBriefNotification {
  return {
    participation,
    projectId: project.id,
    headline: abridgeQuestion(project.challenge),
    fullQuestion: project.challenge,
    title: project.title,
    category: project.category,
    stage: project.status,
    createdAt: participation.createdAt,
    expiresAt: participation.expiresAt,
  };
}

/**
 * Fans a newly submitted challenge out to every expert who could act on it.
 *
 * Internal: called from createProject inside its existing db.update, so the
 * ping is part of the same write that creates the brief and can only ever
 * fire on the client's first submitted message — never while they type, and
 * never again on later messages in the same conversation.
 */
export function notifyExpertsOfNewBriefWithin(d: Database, project: Project): ExpertBriefParticipation[] {
  if (!project.challenge.trim()) return [];

  const now = new Date();
  const createdAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + LIVE_BRIEF_TTL_MS).toISOString();
  const headline = abridgeQuestion(project.challenge);

  /**
   * Everyone, not a category match — the spec wants reach first and
   * targeting later. The one filter is the existing access rule: an expert
   * who can't take client work can't act on a brief, so pinging them would
   * only be noise. A dual-role user never gets pinged about their own brief.
   */
  const eligible = d.expertProfiles.filter(
    (profile) => profile.userId !== project.clientId && getExpertAccess(profile).canAcceptWork,
  );

  const created: ExpertBriefParticipation[] = [];
  for (const profile of eligible) {
    // (brief, expert) is the identity — never a second ping for the same pair.
    const existing = d.expertBriefParticipations.some(
      (p) => p.projectId === project.id && p.expertId === profile.userId,
    );
    if (existing) continue;

    const participation: ExpertBriefParticipation = {
      id: id("participation"),
      projectId: project.id,
      expertId: profile.userId,
      status: "pending",
      createdAt,
      expiresAt,
    };
    d.expertBriefParticipations.push(participation);
    created.push(participation);

    d.notifications.unshift({
      id: id("notif"),
      userId: profile.userId,
      type: "live_brief",
      title: "New client brief",
      body: headline,
      linkHref: "/expert/dashboard",
      read: false,
      createdAt,
    });
  }

  return created;
}

/**
 * The briefs currently at the top of this expert's dashboard.
 *
 * Expiry is derived rather than written: a read that mutates would fire the
 * change feed and pull every listening tab back around the loop. A brief
 * past its five minutes simply stops being returned, which is the whole of
 * what "expired" means to anyone looking at it.
 */
export async function listLiveBriefsForExpert(expertId: string): Promise<LiveBriefNotification[]> {
  return simulateNetwork(
    () => {
      const database = db.get();
      const now = Date.now();
      return database.expertBriefParticipations
        .filter((p) => p.expertId === expertId)
        .filter((p) => p.status === "pending" && new Date(p.expiresAt).getTime() > now)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .map((participation) => {
          const project = database.projects.find((p) => p.id === participation.projectId);
          return project ? listingFor(project, participation) : null;
        })
        .filter((x): x is LiveBriefNotification => x !== null);
    },
    { latency: [80, 180] },
  );
}

function participationOrThrow(d: Database, projectId: string, expertId: string): ExpertBriefParticipation {
  const participation = d.expertBriefParticipations.find(
    (p) => p.projectId === projectId && p.expertId === expertId,
  );
  if (!participation) throw new ApiError("This brief is no longer available.", "NOT_FOUND");
  return participation;
}

/**
 * The same row, but tolerant of experts who never saw a live-brief ping —
 * anyone engaged through the older opportunity route is just as engaged, and
 * shouldn't be locked out of submitting because of how they arrived.
 */
function participationFor(d: Database, projectId: string, expertId: string): ExpertBriefParticipation {
  const existing = d.expertBriefParticipations.find(
    (p) => p.projectId === projectId && p.expertId === expertId,
  );
  if (existing) return existing;

  const project = d.projects.find((p) => p.id === projectId);
  if (!project?.matchedExpertIds.includes(expertId)) {
    throw new ApiError("You aren't engaged on this brief.", "FORBIDDEN");
  }

  const now = new Date().toISOString();
  const participation: ExpertBriefParticipation = {
    id: id("participation"),
    projectId,
    expertId,
    status: "accepted",
    acceptedAt: now,
    createdAt: now,
    expiresAt: now,
  };
  d.expertBriefParticipations.push(participation);
  return participation;
}

/**
 * The expert takes the brief on. No lock: this only ever touches this
 * expert's own row, so the same brief stays live on everyone else's
 * dashboard and any number of experts can be working it at once.
 *
 * Acceptance is what puts the project into their Active Projects and, via
 * `canViewProject`, what opens the client detail behind it — the same
 * matchedExpertIds plumbing an accepted opportunity uses, so nothing
 * downstream has to know which of the two routes an expert arrived by.
 */
export async function acceptLiveBrief(projectId: string, expertId: string): Promise<ExpertBriefParticipation> {
  return simulateNetwork(() =>
    db.update((d) => {
      const participation = participationOrThrow(d, projectId, expertId);
      if (participation.status === "accepted" || participation.status === "submitted") return participation;

      const profile = d.expertProfiles.find((p) => p.userId === expertId);
      const access = getExpertAccess(profile);
      if (!access.canAcceptWork) {
        throw new ApiError(access.reason ?? "You can't take on client work yet.", "NOT_APPROVED");
      }

      const project = d.projects.find((p) => p.id === projectId);
      if (!project) throw new ApiError("Project not found.", "NOT_FOUND");

      const now = new Date().toISOString();
      participation.status = "accepted";
      participation.acceptedAt = now;

      if (!project.matchedExpertIds.includes(expertId)) {
        project.matchedExpertIds.push(expertId);
        project.activity.push({ id: id("act"), label: "An expert joined the brief", timestamp: now });
        project.updatedAt = now;
      }

      return participation;
    }),
  );
}

/** One click, no reason asked. Only this expert's row changes. */
export async function declineLiveBrief(projectId: string, expertId: string): Promise<ExpertBriefParticipation> {
  return simulateNetwork(() =>
    db.update((d) => {
      const participation = participationOrThrow(d, projectId, expertId);
      participation.status = "declined";
      participation.declinedAt = new Date().toISOString();
      return participation;
    }),
    { latency: [60, 140] },
  );
}

/**
 * Closing the banner is neither yes nor no — it just stops asking. The brief
 * stays in the bell and reachable through Opportunities; it simply doesn't
 * push itself back to the top of the dashboard again this session.
 */
export async function dismissLiveBrief(projectId: string, expertId: string): Promise<ExpertBriefParticipation> {
  return simulateNetwork(() =>
    db.update((d) => {
      const participation = participationOrThrow(d, projectId, expertId);
      participation.status = "dismissed";
      participation.dismissedAt = new Date().toISOString();
      return participation;
    }),
    { latency: [60, 140] },
  );
}

/* ------------------------------------------------------- final playbook gate */

export interface FinalPlaybookContender {
  expertId: string;
  name: string;
  points: number;
  rating: number;
}

export interface FinalPlaybookState {
  /** Experts who have actually written playbook input here, best standing first. */
  contenders: FinalPlaybookContender[];
  /** Set once somebody has submitted — the brief is closed to further final submissions. */
  submittedBy?: { expertId: string; name: string; at: string };
  /** True only for the top contender, and only while nobody has submitted. */
  canSubmit: boolean;
  reason?: string;
}

/**
 * Who gets to submit the final playbook for a brief.
 *
 * Everyone who accepted may draft, and every draft stays attached to the
 * brief as supporting material. Only one submission closes it, and the right
 * to make it belongs to the highest-standing expert who has actually written
 * something — standing being the existing points ledger, not a new score.
 * Writing nothing means not being in the running, however senior you are.
 */
function finalStateWithin(d: Database, projectId: string, expertId: string): FinalPlaybookState {
  const submitted = d.expertBriefParticipations.find(
    (p) => p.projectId === projectId && p.status === "submitted",
  );
  if (submitted) {
    const author = d.users.find((u) => u.id === submitted.expertId);
    return {
      contenders: [],
      submittedBy: {
        expertId: submitted.expertId,
        name: author ? `${author.firstName} ${author.lastName}` : "Another expert",
        at: submitted.submittedAt ?? submitted.createdAt,
      },
      canSubmit: false,
      reason:
        submitted.expertId === expertId
          ? "You submitted the final playbook for this brief."
          : "Another expert has already submitted the final playbook. Your work stays attached as supporting material.",
    };
  }

  /**
   * The final playbook is assembled from the client's confirmed brief and
   * executive summary. An expert can draft against a raw challenge from the
   * moment they jump on it, but there's nothing to submit until the client's
   * own material has caught up.
   */
  const project = d.projects.find((p) => p.id === projectId);
  if (!project?.briefId || !project?.reportId) {
    return {
      contenders: [],
      canSubmit: false,
      reason: "Waiting on the client's brief and executive summary — keep drafting in the meantime.",
    };
  }

  const drafted = new Map<string, string>();
  for (const contribution of d.contributions) {
    if (contribution.projectId !== projectId || contribution.type !== "playbook_input") continue;
    const earliest = drafted.get(contribution.expertId);
    if (!earliest || contribution.createdAt < earliest) drafted.set(contribution.expertId, contribution.createdAt);
  }

  const ranked = [...drafted.entries()]
    .map(([contenderId, firstDraftAt]) => {
      const profile = d.expertProfiles.find((p) => p.userId === contenderId);
      const user = d.users.find((u) => u.id === contenderId);
      return {
        contender: {
          expertId: contenderId,
          name: user ? `${user.firstName} ${user.lastName}` : "Expert",
          points: profile?.points ?? 0,
          rating: profile?.rating ?? 0,
        },
        firstDraftAt,
      };
    })
    .sort(
      (a, b) =>
        b.contender.points - a.contender.points ||
        b.contender.rating - a.contender.rating ||
        (a.firstDraftAt < b.firstDraftAt ? -1 : 1),
    );
  const contenders: FinalPlaybookContender[] = ranked.map((r) => r.contender);

  const top = contenders[0];
  if (!top) {
    return { contenders, canSubmit: false, reason: "Contribute playbook input first — that's what puts you in the running." };
  }
  if (top.expertId !== expertId) {
    return {
      contenders,
      canSubmit: false,
      reason: `${top.name} currently leads on standing for this brief. Keep contributing — your input stays attached either way.`,
    };
  }
  return { contenders, canSubmit: true };
}

export async function getFinalPlaybookState(projectId: string, expertId: string): Promise<FinalPlaybookState> {
  return simulateNetwork(() => finalStateWithin(db.get(), projectId, expertId), { latency: [100, 220] });
}

export async function submitFinalPlaybook(projectId: string, expertId: string): Promise<FinalPlaybookState> {
  return simulateNetwork(() =>
    db.update((d) => {
      const state = finalStateWithin(d, projectId, expertId);
      if (!state.canSubmit) {
        throw new ApiError(state.reason ?? "You can't submit the final playbook for this brief.", "FORBIDDEN");
      }

      const participation = participationFor(d, projectId, expertId);
      const now = new Date().toISOString();
      participation.status = "submitted";
      participation.submittedAt = now;

      /**
       * This is what the client has been waiting on. Every accepted expert's
       * input is folded in, so the ones who didn't win the submission still
       * shape what the client ends up reading.
       */
      createPlaybookWithin(d, projectId);

      const project = d.projects.find((p) => p.id === projectId);
      const author = d.users.find((u) => u.id === expertId);
      if (project) {
        project.activity.push({
          id: id("act"),
          label: `Final playbook submitted by ${author ? author.firstName : "an expert"}`,
          timestamp: now,
        });
        project.updatedAt = now;
      }

      return finalStateWithin(d, projectId, expertId);
    }),
  );
}
