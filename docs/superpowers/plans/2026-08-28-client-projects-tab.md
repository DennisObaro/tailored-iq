# Client Projects Tab (Implementation Engagements) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new client-facing "Projects" tab that tracks implementation engagements (client + expert working through a finished playbook together) through a simple In Progress / Completed / Rating pipeline, with a per-engagement workspace holding chat, schedule, and files.

**Architecture:** A new `Engagement` entity (separate from the existing diagnostic `Project`) is created when a client books implementation support from a playbook's "Need help implementing this?" panel. Booking, completion, and rating go through a new `lib/api/engagements.ts` service plus one new function in `lib/api/consultations.ts`, following this repo's existing mock-backend patterns exactly (`db.update`, `xxxWithin` helpers, `simulateNetwork`). The workspace UI reuses the existing chat thread machinery (extracted into a shared `ThreadPanel` component) rather than forking it.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind v4. No test runner in this repo — verification is `tsc --noEmit` + `eslint --max-warnings 0` + manual browser checks (see CLAUDE.md).

**Spec:** `docs/superpowers/specs/2026-08-28-client-projects-tab-design.md`

## Global Constraints

- Pages and components only ever import from `lib/api/*` — never `lib/mock-data/*` or `lib/ai-sim/*` directly (CLAUDE.md service-layer boundary).
- Every `lib/api/*.ts` function wraps its body in `simulateNetwork()` (reads/writes) or `simulateGeneration()` (AI-generation-style calls) — this feature only ever needs `simulateNetwork()`.
- Any new status string introduced anywhere in the app needs an entry in `STATUS_LABELS` (`components/ui/status-badge.tsx`) or it silently renders as the raw slug.
- Bump the `STORAGE_KEY` in `lib/api/_db.ts` whenever the `Database` shape changes — currently `"tiq_db_v11"`.
- Verification throughout: `npx tsc --noEmit` and `npx eslint app components lib hooks --max-warnings 0` must both pass with zero errors/warnings before every commit. There is no test suite — do not invent one; follow this repo's existing manual-verification convention instead.
- Demo accounts for manual verification (pick from the sign-in page's account picker): **Demo client** = Amara Chen (`user_demo_client`), **Demo expert** = Marcus Webb (`user_demo_expert`), **Demo dual-role** = Jordan Blake (`user_demo_dual`). `playbook_1` (status `ready`, `projectId: "project_1"`) belongs to Amara and is the playbook to use for manual verification of the implementation flow.
- Follow existing code style exactly: `"use client"` at the top of interactive pages/components, `useSessionStore((s) => s.user)` for the current user, `Skeleton`/`ErrorState` for loading/not-found states, Tailwind utility classes matching neighboring files (no new design tokens).

---

### Task 1: `Engagement` types

**Files:**
- Create: `lib/types/engagement.ts`
- Modify: `lib/types/index.ts`

**Interfaces:**
- Produces: `Engagement`, `EngagementStatus`, `EngagementReview` — used by every later task.

- [ ] **Step 1: Create the type file**

```ts
// lib/types/engagement.ts

export type EngagementStatus = "in_progress" | "pending_completion" | "completed";

/**
 * Tracked implementation work between a client and one expert on one
 * playbook — created when the client books implementation support from the
 * playbook's "Need help implementing this?" panel. Deliberately separate
 * from `Project` (lib/types/project.ts), which is the diagnosis pipeline.
 */
export interface Engagement {
  id: string;
  clientId: string;
  expertId: string;
  playbookId: string;
  /** The diagnostic project this playbook came from. Always present — booking is only offered for project-generated playbooks. */
  projectId: string;
  /** The ExpertConversation thread reused as this engagement's chat. */
  conversationId: string;
  status: EngagementStatus;
  completionProposedBy?: "client" | "expert";
  completionProposedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EngagementReview {
  id: string;
  engagementId: string;
  fromUserId: string;
  fromRole: "client" | "expert";
  toUserId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}
```

- [ ] **Step 2: Export it from the types barrel**

Add one line to `lib/types/index.ts` (matches the existing `export * from "./consultation";` pattern — append after the last line):

```ts
export * from "./engagement";
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npx eslint app components lib hooks --max-warnings 0`
Expected: both succeed with no errors (this file isn't imported anywhere yet, so nothing else changes).

- [ ] **Step 4: Commit**

```bash
git add lib/types/engagement.ts lib/types/index.ts
git commit -m "Add Engagement and EngagementReview types"
```

---

### Task 2: Extend `Consultation` and `ExpertConversation`

**Files:**
- Modify: `lib/types/consultation.ts`
- Modify: `lib/types/expert-conversation.ts`
- Modify: `lib/mock-data/fixtures/consultations.fixture.ts` (4 object literals)
- Modify: `lib/mock-data/fixtures/expert-review-history.fixture.ts` (1 `.map()`)
- Modify: `lib/api/consultations.ts` (1 object literal, in `bookConsultation`)

**Interfaces:**
- Consumes: nothing new.
- Produces: `ConsultationMode`, `Consultation.mode`, `Consultation.engagementId`, `ExpertConversation.engagementId` — used by Tasks 5, 6, 15.

This task adds a **required** field (`mode`) to `Consultation`, which breaks every place that constructs a `Consultation` object literal — grep confirms there are exactly three: `lib/mock-data/fixtures/consultations.fixture.ts` (4 literals), `lib/mock-data/fixtures/expert-review-history.fixture.ts` (1 `.map()`), and `lib/api/consultations.ts`'s `bookConsultation`. All three are fixed in this same task so `tsc` stays green at the commit.

- [ ] **Step 1: Extend the types**

In `lib/types/consultation.ts`:

```diff
 export type ConsultationStatus = "scheduled" | "in_call" | "completed" | "cancelled";
+export type ConsultationMode = "virtual" | "on_site";

 export interface TranscriptLine {
```

```diff
 export interface Consultation {
   id: string;
   projectId: string;
   clientId: string;
   expertId: string;
   scheduledFor: string;
   status: ConsultationStatus;
+  mode: ConsultationMode;
+  /** Set when this call belongs to an implementation Engagement rather than the diagnostic booking flow. */
+  engagementId?: string;
   recordingConsent: boolean;
```

In `lib/types/expert-conversation.ts`:

```diff
 export interface ExpertConversation {
   id: string;
   clientId: string;
   expertId: string;
   projectId: string;
   consultationId?: string;
   playbookId?: string;
+  engagementId?: string;
   status: ExpertConversationStatus;
```

- [ ] **Step 2: Backfill the fixture literals**

In `lib/mock-data/fixtures/consultations.fixture.ts`, add `mode: "virtual",` right after each of the four `status:` lines (for `consultation_1`, `consultation_2`, `consultation_6`, `consultation_9`). For example:

```diff
     id: "consultation_1",
     projectId: "project_1",
     clientId: DEMO_CLIENT_ID,
     expertId: DEMO_EXPERT_ID,
     scheduledFor: d(5),
     status: "completed",
+    mode: "virtual",
     recordingConsent: true,
```

Do the same after `status: "scheduled",` (consultation_2), after `status: "completed",` (consultation_6), and after `status: "completed",` (consultation_9).

In `lib/mock-data/fixtures/expert-review-history.fixture.ts`, inside `historicalConsultations`'s `.map()`:

```diff
 export const historicalConsultations: Consultation[] = ROWS.map((row) => ({
   id: `consultation_${row.id}`,
   projectId: `project_${row.id}`,
   clientId: row.clientId,
   expertId: row.expertId,
   scheduledFor: d(row.day),
   status: "completed",
+  mode: "virtual",
   recordingConsent: true,
   durationSeconds: 1800,
   createdAt: d(row.day),
 }));
```

- [ ] **Step 3: Backfill the diagnostic booking function**

In `lib/api/consultations.ts`, inside `bookConsultation`:

```diff
       const consultation: Consultation = {
         id: id("consultation"),
         projectId: project.id,
         clientId: input.clientId,
         expertId: input.expertId,
         scheduledFor: input.scheduledFor,
         status: "scheduled",
+        mode: "virtual",
         recordingConsent: true,
         createdAt: now,
       };
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npx eslint app components lib hooks --max-warnings 0`
Expected: both succeed with no errors — every `Consultation` construction site now satisfies the extended type.

- [ ] **Step 5: Commit**

```bash
git add lib/types/consultation.ts lib/types/expert-conversation.ts lib/mock-data/fixtures/consultations.fixture.ts lib/mock-data/fixtures/expert-review-history.fixture.ts lib/api/consultations.ts
git commit -m "Add ConsultationMode and engagementId link fields"
```

---

### Task 3: Database shape

**Files:**
- Modify: `lib/api/_db.ts`
- Modify: `lib/mock-data/fixtures/seed.ts`

**Interfaces:**
- Consumes: `Engagement`, `EngagementReview` (Task 1).
- Produces: `Database.engagements`, `Database.engagementReviews` — used by every `lib/api/engagements.ts` function from Task 5 onward.

- [ ] **Step 1: Add the tables to `Database`**

In `lib/api/_db.ts`, add to the type-only import block (right after `ConversationMessage,`):

```diff
   ExpertConversation,
   ConversationMessage,
+  Engagement,
+  EngagementReview,
   PlaybookDocument,
```

Add the fields to the `Database` interface, right after `conversationMessages: ConversationMessage[];`:

```diff
   expertConversations: ExpertConversation[];
   conversationMessages: ConversationMessage[];
+  /**
+   * Implementation-tracking relationships, one per (client, expert,
+   * playbook) — created when a client books implementation support from a
+   * playbook's "Need help implementing this?" panel.
+   */
+  engagements: Engagement[];
+  engagementReviews: EngagementReview[];
   /**
    * The expert-side collaborative playbook. Separate from `playbooks`, which
```

- [ ] **Step 2: Bump the storage key**

```diff
-const STORAGE_KEY = "tiq_db_v11";
+const STORAGE_KEY = "tiq_db_v12";
```

- [ ] **Step 3: Seed the new tables as empty**

In `lib/mock-data/fixtures/seed.ts`, right after `conversationMessages: [],`:

```diff
     expertConversations: structuredClone(seedExpertConversations),
     conversationMessages: [],
+    /** Nothing pre-seeded: an engagement only exists once a client books implementation support. */
+    engagements: [],
+    engagementReviews: [],
     ...seedPlaybookWorkspace(),
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npx eslint app components lib hooks --max-warnings 0`
Expected: both succeed.

Manually: run `npm run dev`, open the app in a browser, open devtools → Application → Local Storage, confirm a fresh `tiq_db_v12` key appears (the old `tiq_db_v11` key, if present from earlier development, is simply ignored now).

- [ ] **Step 5: Commit**

```bash
git add lib/api/_db.ts lib/mock-data/fixtures/seed.ts
git commit -m "Add engagements/engagementReviews tables, bump storage key to v12"
```

---

### Task 4: Access control

**Files:**
- Modify: `lib/api/_access.ts`

**Interfaces:**
- Consumes: `Database.engagements` (Task 3).
- Produces: `canViewEngagement(d, engagementId, viewerId): boolean` — used by Task 5, 6, 7.

- [ ] **Step 1: Add the guard**

Append to `lib/api/_access.ts`:

```ts
/**
 * An implementation engagement is a private relationship between exactly
 * one client and one expert — same reasoning as canViewExpertConversation
 * above, deliberately not routed through canViewProject's broader
 * matched-experts logic.
 */
export function canViewEngagement(d: Database, engagementId: string, viewerId: string): boolean {
  const engagement = d.engagements.find((e) => e.id === engagementId);
  if (!engagement) return false;
  return engagement.clientId === viewerId || engagement.expertId === viewerId;
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npx eslint app components lib hooks --max-warnings 0`
Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add lib/api/_access.ts
git commit -m "Add canViewEngagement access guard"
```

---

### Task 5: Engagement read/create API

**Files:**
- Create: `lib/api/engagements.ts`

**Interfaces:**
- Consumes: `Engagement`, `EngagementReview` (Task 1), `Database` (Task 3), `canViewEngagement` (Task 4), `getOrCreateConversationWithin(d, { clientId, expertId, projectId }): ExpertConversation` (existing, `lib/api/expert-conversations.ts`).
- Produces: `getOrCreateEngagementWithin(d, input): Engagement`, `EngagementListing`, `listEngagementsForClient(clientId): Promise<EngagementListing[]>`, `listEngagementsForExpert(expertId): Promise<EngagementListing[]>`, `EngagementDetail`, `getEngagement(id, viewerId): Promise<EngagementDetail | null>`, `EngagementAttachment`, `listAttachmentsForEngagement(engagementId, viewerId): Promise<EngagementAttachment[]>` — used by Task 6 (`getOrCreateEngagementWithin`) and every UI task from Task 13 onward.

- [ ] **Step 1: Write the file**

```ts
// lib/api/engagements.ts
import type { Engagement, EngagementReview, MessageAttachment, Playbook, User, ExpertProfile } from "@/lib/types";
import { simulateNetwork, ApiError } from "./client";
import { db, type Database } from "./_db";
import { canViewEngagement } from "./_access";
import { getOrCreateConversationWithin } from "./expert-conversations";
import { id } from "@/lib/utils/id";

/**
 * One engagement per (client, expert, playbook) — repeat bookings with the
 * same expert on the same playbook accumulate onto the one engagement
 * rather than forking it, the same identity rule ExpertConversation uses
 * for (client, expert, project). Called from inside an existing
 * db.update() — see bookImplementationConsultation.
 */
export function getOrCreateEngagementWithin(
  d: Database,
  input: { clientId: string; expertId: string; playbookId: string; projectId: string },
): Engagement {
  const existing = d.engagements.find(
    (e) => e.clientId === input.clientId && e.expertId === input.expertId && e.playbookId === input.playbookId,
  );
  if (existing) return existing;

  const conversation = getOrCreateConversationWithin(d, {
    clientId: input.clientId,
    expertId: input.expertId,
    projectId: input.projectId,
  });

  const now = new Date().toISOString();
  const engagement: Engagement = {
    id: id("engagement"),
    clientId: input.clientId,
    expertId: input.expertId,
    playbookId: input.playbookId,
    projectId: input.projectId,
    conversationId: conversation.id,
    status: "in_progress",
    createdAt: now,
    updatedAt: now,
  };
  d.engagements.push(engagement);
  return engagement;
}

export interface EngagementListing {
  engagement: Engagement;
  counterpart: User;
  /** Present when the viewer is the client — the expert's headline for the row. */
  counterpartProfile?: ExpertProfile;
  playbookTitle: string;
  myReview?: EngagementReview;
  otherReview?: EngagementReview;
}

function toListing(d: Database, engagement: Engagement, viewerId: string): EngagementListing | null {
  const isClient = engagement.clientId === viewerId;
  const counterpartId = isClient ? engagement.expertId : engagement.clientId;
  const counterpart = d.users.find((u) => u.id === counterpartId);
  const playbook = d.playbooks.find((p) => p.id === engagement.playbookId);
  if (!counterpart || !playbook) return null;

  const reviews = d.engagementReviews.filter((r) => r.engagementId === engagement.id);
  return {
    engagement,
    counterpart,
    counterpartProfile: isClient ? d.expertProfiles.find((p) => p.userId === counterpartId) : undefined,
    playbookTitle: playbook.title,
    myReview: reviews.find((r) => r.fromUserId === viewerId),
    otherReview: reviews.find((r) => r.fromUserId !== viewerId),
  };
}

export async function listEngagementsForClient(clientId: string): Promise<EngagementListing[]> {
  return simulateNetwork(
    () => {
      const d = db.get();
      return d.engagements
        .filter((e) => e.clientId === clientId)
        .map((e) => toListing(d, e, clientId))
        .filter((x): x is EngagementListing => x !== null)
        .sort((a, b) => (a.engagement.updatedAt < b.engagement.updatedAt ? 1 : -1));
    },
    { latency: [120, 250] },
  );
}

export async function listEngagementsForExpert(expertId: string): Promise<EngagementListing[]> {
  return simulateNetwork(
    () => {
      const d = db.get();
      return d.engagements
        .filter((e) => e.expertId === expertId)
        .map((e) => toListing(d, e, expertId))
        .filter((x): x is EngagementListing => x !== null)
        .sort((a, b) => (a.engagement.updatedAt < b.engagement.updatedAt ? 1 : -1));
    },
    { latency: [120, 250] },
  );
}

export interface EngagementDetail {
  engagement: Engagement;
  counterpart: User;
  counterpartProfile?: ExpertProfile;
  playbook: Pick<Playbook, "id" | "title">;
  viewerRole: "client" | "expert";
  myReview?: EngagementReview;
  otherReview?: EngagementReview;
}

/** The engagement, or null for anyone who isn't one of its two people. */
export async function getEngagement(engagementId: string, viewerId: string): Promise<EngagementDetail | null> {
  return simulateNetwork(
    () => {
      const d = db.get();
      if (!canViewEngagement(d, engagementId, viewerId)) return null;
      const engagement = d.engagements.find((e) => e.id === engagementId);
      if (!engagement) return null;
      const listing = toListing(d, engagement, viewerId);
      if (!listing) return null;
      const playbook = d.playbooks.find((p) => p.id === engagement.playbookId)!;

      return {
        engagement,
        counterpart: listing.counterpart,
        counterpartProfile: listing.counterpartProfile,
        playbook: { id: playbook.id, title: playbook.title },
        viewerRole: engagement.clientId === viewerId ? "client" : "expert",
        myReview: listing.myReview,
        otherReview: listing.otherReview,
      };
    },
    { latency: [100, 220] },
  );
}

export interface EngagementAttachment {
  attachment: MessageAttachment;
  messageId: string;
  createdAt: string;
}

/** Every file shared in the engagement's chat, flattened. No separate storage — same MessageAttachment records the thread already carries. */
export async function listAttachmentsForEngagement(
  engagementId: string,
  viewerId: string,
): Promise<EngagementAttachment[]> {
  return simulateNetwork(
    () => {
      const d = db.get();
      if (!canViewEngagement(d, engagementId, viewerId)) return [];
      const engagement = d.engagements.find((e) => e.id === engagementId);
      if (!engagement) return [];

      const messages = d.conversationMessages.filter((m) => m.conversationId === engagement.conversationId);
      const out: EngagementAttachment[] = [];
      for (const message of messages) {
        for (const attachment of message.attachments) {
          out.push({ attachment, messageId: message.id, createdAt: message.createdAt });
        }
      }
      return out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
    { latency: [100, 200] },
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npx eslint app components lib hooks --max-warnings 0`
Expected: both succeed (nothing calls this module yet, but it must type-check standalone).

- [ ] **Step 3: Commit**

```bash
git add lib/api/engagements.ts
git commit -m "Add engagement read/create API"
```

---

### Task 6: Implementation booking API

**Files:**
- Modify: `lib/api/consultations.ts`

**Interfaces:**
- Consumes: `getOrCreateEngagementWithin` (Task 5), `ConsultationMode` (Task 2).
- Produces: `bookImplementationConsultation(input): Promise<{ consultation, engagementId, conversationId }>`, `completeOnSiteSession(consultationId): Promise<Consultation>` — used by Task 10 (booking page) and Task 15 (schedule log).

`bookConsultation` is deliberately **not** modified for the implementation path — it unconditionally sets `project.consultationId` and `project.status = "consultation_scheduled"`, which is correct for the one-time diagnostic booking but would corrupt an already-`playbook_ready`/`completed` project, and would get repeatedly overwritten by every implementation call. This task adds a separate function instead, sharing the existing private slot-validation helpers in this file.

- [ ] **Step 1: Add the import**

```diff
-import type { Consultation, ExpertWillingness, Project, Review, User } from "@/lib/types";
+import type { Consultation, ConsultationMode, ExpertWillingness, Project, Review, User } from "@/lib/types";
 import { simulateNetwork, simulateGeneration, ApiError } from "./client";
 import { db, type Database } from "./_db";
 import { createProjectWithin } from "./projects";
 import { id } from "@/lib/utils/id";
 import { formatCallWhen } from "@/lib/utils/format";
 import { getOrCreateConversationWithin, postSystemMessageWithin } from "./expert-conversations";
+import { getOrCreateEngagementWithin } from "./engagements";
 import { generateTranscript } from "@/lib/ai-sim/transcript-generator";
```

- [ ] **Step 2: Add `bookImplementationConsultation`**

Add this function after `bookConsultation` (after its closing `}` around line 268):

```ts
/**
 * Booking implementation support against a finished playbook — separate
 * from bookConsultation (the diagnostic flow) because that function
 * unconditionally rewrites project.status/project.consultationId, which
 * must never happen here: the project this playbook came from is typically
 * already playbook_ready/completed, and an engagement can have many
 * consultations over time.
 */
export async function bookImplementationConsultation(input: {
  playbookId: string;
  clientId: string;
  expertId: string;
  scheduledFor: string;
  mode: ConsultationMode;
}): Promise<{ consultation: Consultation; engagementId: string; conversationId: string }> {
  return simulateNetwork(() =>
    db.update((d) => {
      const now = new Date().toISOString();

      const expertProfile = d.expertProfiles.find((p) => p.userId === input.expertId);
      if (!expertProfile) throw new ApiError("Expert not found.", "NOT_FOUND");

      const wanted = new Date(input.scheduledFor).getTime();
      const offered = expandAvailability(expertProfile.weeklyAvailability, {
        noticeDays: expertProfile.availabilityPreferences?.noticeDays ?? 0,
        windowDays: BOOKING_WINDOW_DAYS,
      }).some((slot) => new Date(slot.iso).getTime() === wanted);
      if (!offered) {
        throw new ApiError("That time is no longer offered by this expert.", "SLOT_UNAVAILABLE");
      }
      if (bookedTimesWithin(d, input.expertId).has(wanted.toString())) {
        throw new ApiError("Someone else just booked that time.", "SLOT_TAKEN");
      }

      const playbook = d.playbooks.find((p) => p.id === input.playbookId);
      if (!playbook) throw new ApiError("Playbook not found.", "NOT_FOUND");
      if (!playbook.projectId) {
        throw new ApiError("This playbook isn't linked to a challenge yet.", "VALIDATION");
      }
      const project = d.projects.find((p) => p.id === playbook.projectId);
      if (!project) throw new ApiError("Project not found.", "NOT_FOUND");

      /** Same reasoning as bookConsultation: the expert needs read access to the brief/report for context. */
      if (!project.matchedExpertIds.includes(input.expertId)) {
        project.matchedExpertIds.push(input.expertId);
      }

      const engagement = getOrCreateEngagementWithin(d, {
        clientId: input.clientId,
        expertId: input.expertId,
        playbookId: input.playbookId,
        projectId: project.id,
      });

      const consultation: Consultation = {
        id: id("consultation"),
        projectId: project.id,
        clientId: input.clientId,
        expertId: input.expertId,
        scheduledFor: input.scheduledFor,
        status: "scheduled",
        mode: input.mode,
        engagementId: engagement.id,
        recordingConsent: true,
        createdAt: now,
      };
      d.consultations.push(consultation);

      const conversation = d.expertConversations.find((c) => c.id === engagement.conversationId)!;
      conversation.consultationId = consultation.id;
      conversation.playbookId = input.playbookId;
      conversation.engagementId = engagement.id;
      conversation.updatedAt = now;
      postSystemMessageWithin(
        d,
        conversation.id,
        input.mode === "virtual"
          ? `Implementation call scheduled — ${formatCallWhen(consultation.scheduledFor)}`
          : `On-site session scheduled — ${formatCallWhen(consultation.scheduledFor)}`,
      );

      const client = d.users.find((u) => u.id === input.clientId);
      const expert = d.users.find((u) => u.id === input.expertId);
      d.notifications.unshift({
        id: id("notif"),
        userId: input.clientId,
        type: "booking_confirmed",
        title: "Implementation session confirmed",
        body: `Your session with ${expert ? expert.firstName : "your expert"} on "${playbook.title}" is scheduled.`,
        linkHref: `/engagements/${engagement.id}`,
        read: false,
        createdAt: now,
      });
      d.notifications.unshift({
        id: id("notif"),
        userId: input.expertId,
        type: "booking_confirmed",
        title: "Implementation session booked",
        body: `${client ? client.firstName : "A client"} booked a session on "${playbook.title}".`,
        linkHref: `/engagements/${engagement.id}`,
        read: false,
        createdAt: now,
      });

      return { consultation, engagementId: engagement.id, conversationId: conversation.id };
    }),
  );
}

/** On-site sessions have no call audio to transcribe — either party logs them done directly. */
export async function completeOnSiteSession(consultationId: string): Promise<Consultation> {
  return simulateNetwork(() =>
    db.update((d) => {
      const consultation = d.consultations.find((c) => c.id === consultationId);
      if (!consultation) throw new ApiError("Consultation not found.", "NOT_FOUND");
      if (consultation.mode !== "on_site") {
        throw new ApiError("Only on-site sessions are completed this way.", "INVALID_STATE");
      }
      if (consultation.status !== "scheduled") {
        throw new ApiError("This session isn't scheduled.", "INVALID_STATE");
      }
      consultation.status = "completed";

      const expertProfile = d.expertProfiles.find((p) => p.userId === consultation.expertId);
      if (expertProfile) {
        awardPointsWithin(d, {
          expertId: consultation.expertId,
          source: "client_consultation",
          note: "Implementation session completed",
        });
      }
      return consultation;
    }),
  );
}
```

- [ ] **Step 3: Stop `endCall` from touching an already-finished diagnostic project**

In `endCall`, guard the project-mutation block:

```diff
       consultation.status = "completed";
       consultation.transcript = transcript;
       consultation.extractedInsights = extractedInsights;
       consultation.durationSeconds = durationSeconds;

-      project.status = "consultation_completed";
-      project.updatedAt = now;
-      project.activity.push({ id: id("act"), label: "Consultation completed", timestamp: now });
+      if (!consultation.engagementId) {
+        project.status = "consultation_completed";
+        project.updatedAt = now;
+        project.activity.push({ id: id("act"), label: "Consultation completed", timestamp: now });
+      }
```

Transcript generation, duration, and the expert's point award stay unconditional for both paths.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npx eslint app components lib hooks --max-warnings 0`
Expected: both succeed.

- [ ] **Step 5: Commit**

```bash
git add lib/api/consultations.ts
git commit -m "Add bookImplementationConsultation and on-site session completion"
```

---

### Task 7: Completion & rating API

**Files:**
- Modify: `lib/api/engagements.ts`

**Interfaces:**
- Consumes: `Engagement`, `EngagementReview` (Task 1).
- Produces: `proposeCompletion(engagementId, userId): Promise<Engagement>`, `confirmCompletion(engagementId, userId): Promise<Engagement>`, `retractCompletionProposal(engagementId, userId): Promise<Engagement>`, `submitEngagementReview(input): Promise<EngagementReview>` — used by Task 14 (header) and Task 17 (rating).

- [ ] **Step 1: Append to `lib/api/engagements.ts`**

```ts
function assertEngagement(d: Database, engagementId: string): Engagement {
  const engagement = d.engagements.find((e) => e.id === engagementId);
  if (!engagement) throw new ApiError("Engagement not found.", "NOT_FOUND");
  return engagement;
}

function roleOf(engagement: Engagement, userId: string): "client" | "expert" {
  return engagement.clientId === userId ? "client" : "expert";
}

export async function proposeCompletion(engagementId: string, userId: string): Promise<Engagement> {
  return simulateNetwork(() =>
    db.update((d) => {
      const engagement = assertEngagement(d, engagementId);
      if (engagement.clientId !== userId && engagement.expertId !== userId) {
        throw new ApiError("You aren't part of this engagement.", "FORBIDDEN");
      }
      if (engagement.status !== "in_progress") {
        throw new ApiError("This engagement isn't in progress.", "INVALID_STATE");
      }
      engagement.status = "pending_completion";
      engagement.completionProposedBy = roleOf(engagement, userId);
      engagement.completionProposedAt = new Date().toISOString();
      engagement.updatedAt = engagement.completionProposedAt;
      return engagement;
    }),
  );
}

/** Only the party that did NOT propose may confirm — a proposer can't unilaterally close their own proposal. */
export async function confirmCompletion(engagementId: string, userId: string): Promise<Engagement> {
  return simulateNetwork(() =>
    db.update((d) => {
      const engagement = assertEngagement(d, engagementId);
      if (engagement.status !== "pending_completion") {
        throw new ApiError("There's no completion proposal to confirm.", "INVALID_STATE");
      }
      if (roleOf(engagement, userId) === engagement.completionProposedBy) {
        throw new ApiError("The other party needs to confirm this.", "FORBIDDEN");
      }
      engagement.status = "completed";
      engagement.updatedAt = new Date().toISOString();
      return engagement;
    }),
  );
}

export async function retractCompletionProposal(engagementId: string, userId: string): Promise<Engagement> {
  return simulateNetwork(() =>
    db.update((d) => {
      const engagement = assertEngagement(d, engagementId);
      if (engagement.clientId !== userId && engagement.expertId !== userId) {
        throw new ApiError("You aren't part of this engagement.", "FORBIDDEN");
      }
      if (engagement.status !== "pending_completion") {
        throw new ApiError("There's no completion proposal to retract.", "INVALID_STATE");
      }
      engagement.status = "in_progress";
      engagement.completionProposedBy = undefined;
      engagement.completionProposedAt = undefined;
      engagement.updatedAt = new Date().toISOString();
      return engagement;
    }),
  );
}

/** One review per (engagement, fromUserId) — resubmitting edits rather than duplicating. */
export async function submitEngagementReview(input: {
  engagementId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment?: string;
}): Promise<EngagementReview> {
  return simulateNetwork(() =>
    db.update((d) => {
      const engagement = assertEngagement(d, input.engagementId);
      if (engagement.status !== "completed") {
        throw new ApiError("You can only rate a completed engagement.", "INVALID_STATE");
      }
      if (engagement.clientId !== input.fromUserId && engagement.expertId !== input.fromUserId) {
        throw new ApiError("You aren't part of this engagement.", "FORBIDDEN");
      }

      const existing = d.engagementReviews.find(
        (r) => r.engagementId === input.engagementId && r.fromUserId === input.fromUserId,
      );
      if (existing) {
        existing.rating = input.rating;
        existing.comment = input.comment;
        return existing;
      }

      const review: EngagementReview = {
        id: id("engagement_review"),
        engagementId: input.engagementId,
        fromUserId: input.fromUserId,
        fromRole: roleOf(engagement, input.fromUserId),
        toUserId: input.toUserId,
        rating: input.rating,
        comment: input.comment,
        createdAt: new Date().toISOString(),
      };
      d.engagementReviews.push(review);
      return review;
    }),
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npx eslint app components lib hooks --max-warnings 0`
Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add lib/api/engagements.ts
git commit -m "Add engagement completion and rating API"
```

---

### Task 8: Status badge and nav entry

**Files:**
- Modify: `components/ui/status-badge.tsx`
- Modify: `lib/constants/nav.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: renders `EngagementStatus` values correctly; adds the "Projects" nav item for the `client` role.

`in_progress` and `completed` already exist in `STATUS_LABELS` with the right sense and are reused as-is. Only `pending_completion` is new.

- [ ] **Step 1: Add the status label**

```diff
   in_call: { label: "In call", tone: "progress" },
   cancelled: { label: "Cancelled", tone: "danger" },
+  // Engagement status (lib/types/engagement.ts) — in_progress/completed reuse the entries above.
+  pending_completion: { label: "Pending completion", tone: "warning" },
```

- [ ] **Step 2: Add the client nav item**

`Briefcase01` is already imported and built in this file for `EXPERT_NAV`'s "Opportunities" — reused here since a client never sees `EXPERT_NAV`, so there's no visual collision.

```diff
 export const CLIENT_NAV: NavItem[] = [
   { label: "Home", href: "/dashboard", icon: Home },
   { label: "Ask TailoredIQ", href: "/chat", icon: Chat },
   { label: "Challenges", href: "/projects", icon: FolderKanban },
   { label: "Executive summaries", href: "/reports", icon: Reports },
   { label: "Playbooks", href: "/playbooks", icon: Playbooks },
+  { label: "Projects", href: "/engagements", icon: Briefcase01 },
   { label: "Experts", href: "/experts", icon: Experts },
   { label: "Conversations", href: "/conversations", icon: Conversations },
   { label: "Rewards", href: "/rewards", icon: Award01 },
 ];
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npx eslint app components lib hooks --max-warnings 0`
Expected: both succeed.

Manually: `npm run dev`, sign in as Demo client, confirm a "Projects" sidebar item appears (it 404s for now — the route doesn't exist until Task 13 — that's expected at this point).

- [ ] **Step 4: Commit**

```bash
git add components/ui/status-badge.tsx lib/constants/nav.tsx
git commit -m "Add pending_completion status label and client Projects nav item"
```

---

### Task 9: Willingness filter + `playbookId` threading

**Files:**
- Modify: `lib/api/experts.ts`
- Modify: `components/expert/expert-card.tsx`
- Modify: `components/expert/relevant-experts-panel.tsx`
- Modify: `app/(app)/playbooks/[playbookId]/page.tsx`
- Modify: `app/(app)/experts/[expertId]/page.tsx`

**Interfaces:**
- Consumes: `ExpertWillingness` (existing, `lib/types/user.ts`).
- Produces: `getRelevantExperts` gains `requireWillingness`; `ExpertCard`/`RelevantExpertsPanel` gain `playbookId`; the expert profile page's `bookHref` carries `playbookId` — used by Task 10.

Today the playbook page's "Need help implementing this?" panel calls `getRelevantExperts` with no willingness filter at all — it shows the project's already-matched experts (or a category fallback) regardless of whether they offered implementation support. This task makes the filter real, and threads `playbookId` end-to-end so the booking page (Task 10) knows it's in implementation mode.

- [ ] **Step 1: Add the filter to `getRelevantExperts`**

In `lib/api/experts.ts`:

```diff
-import type { User, ExpertProfile, Project } from "@/lib/types";
+import type { User, ExpertProfile, ExpertWillingness, Project } from "@/lib/types";
```

```diff
 export interface RelevantExpertsInput {
   clientId: string;
   /** The project the document came out of. Absent for a playbook unlocked from the Explore catalog. */
   projectId?: string;
   /** The document's own words (summary, insights), scored only when there's no project match to lean on. */
   text?: string;
   limit?: number;
+  /** Narrow to experts who offered this specific engagement mode — used for the post-playbook implementation rail. */
+  requireWillingness?: ExpertWillingness;
 }
```

```diff
 export async function getRelevantExperts({
   clientId,
   projectId,
   text = "",
   limit = 3,
+  requireWillingness,
 }: RelevantExpertsInput): Promise<ExpertListing[]> {
   return simulateNetwork(
     () => {
       const database = db.get();
       const byUserId = new Map(joinExperts(database).map((l) => [l.user.id, l]));
+      const offersWillingness = (l: ExpertListing) =>
+        !requireWillingness || l.profile.willingness.includes(requireWillingness);

       const project = projectId ? database.projects.find((p) => p.id === projectId) : undefined;
       if (project) {
         const matched = project.matchedExpertIds
           .map((expertId) => byUserId.get(expertId))
-          .filter((l): l is ExpertListing => l !== undefined);
+          .filter((l): l is ExpertListing => l !== undefined)
+          .filter(offersWillingness);
         if (matched.length > 0) return matched.slice(0, limit);
       }

       const client = database.clientProfiles.find((c) => c.userId === clientId);

       const category =
         (project ? resolveProjectCategory(project, database) : null) ??
         scoreCategories(text).find((s) => s.score > 0)?.category ??
         (client ? FUNCTION_TO_CATEGORY[client.function] : undefined) ??
         null;
       if (!category) return [];

-      return matchExperts(database.expertProfiles, category, client ? [client.industry] : [], limit)
+      return matchExperts(
+        database.expertProfiles,
+        category,
+        client ? [client.industry] : [],
+        requireWillingness ? limit * 4 : limit,
+      )
         .map((profile) => byUserId.get(profile.userId))
-        .filter((l): l is ExpertListing => l !== undefined);
+        .filter((l): l is ExpertListing => l !== undefined)
+        .filter(offersWillingness)
+        .slice(0, limit);
     },
     { latency: [250, 500] },
   );
 }
```

(The `limit * 4` over-fetch on the fallback path is because `matchExperts` limits before this filter runs — over-fetching and slicing afterward avoids under-filling results when few candidates offer implementation support.)

- [ ] **Step 2: Thread `playbookId` through the card and panel**

In `components/expert/expert-card.tsx`:

```diff
 export function ExpertCard({
   listing,
   projectId,
+  playbookId,
   reason,
   truncateReason = false,
 }: {
   listing: ExpertListing;
   projectId?: string;
+  playbookId?: string;
   reason?: string;
   truncateReason?: boolean;
 }) {
   ...
   const params = new URLSearchParams();
   if (projectId) params.set("projectId", projectId);
+  if (playbookId) params.set("playbookId", playbookId);
   if (reason) params.set("reason", reason);
```

In `components/expert/relevant-experts-panel.tsx`:

```diff
 export function RelevantExpertsPanel({
   projectId,
+  playbookId,
   experts,
   loading,
   variant = "relevant",
   emptyMessage = "Relevant experience will show up here as we learn more about your challenge.",
   className,
 }: {
   projectId?: string;
+  playbookId?: string;
   experts: ExpertListing[];
   loading: boolean;
   variant?: ExpertsPanelVariant;
   emptyMessage?: string;
   className?: string;
 }) {
```

```diff
           {experts.map((listing) => (
-            <ExpertCard key={listing.user.id} listing={listing} projectId={projectId} />
+            <ExpertCard key={listing.user.id} listing={listing} projectId={projectId} playbookId={playbookId} />
           ))}
```

- [ ] **Step 3: Pass `playbookId` and the willingness filter from the playbook page**

In `app/(app)/playbooks/[playbookId]/page.tsx`:

```diff
       const listings = await expertsApi.getRelevantExperts({
         clientId,
         projectId: matchProjectId,
         text: matchText,
+        requireWillingness: "consulting_engagement",
       });
```

```diff
   const expertsPanel = {
     projectId: playbook.projectId,
+    playbookId: playbook.id,
     experts,
     loading: expertsLoading,
     variant: "implementation" as const,
     emptyMessage: "No expert experience matches this playbook yet — we'll surface people as soon as one does.",
   };
```

- [ ] **Step 4: Carry `playbookId` into the booking link on the expert profile page**

In `app/(app)/experts/[expertId]/page.tsx`:

```diff
   const projectId = searchParams.get("projectId");
+  const playbookId = searchParams.get("playbookId");
   const reason = searchParams.get("reason");
```

```diff
-  const bookHref = projectId ? `/experts/${user.id}/book?projectId=${projectId}` : `/experts/${user.id}/book`;
+  const bookParams = new URLSearchParams();
+  if (playbookId) bookParams.set("playbookId", playbookId);
+  else if (projectId) bookParams.set("projectId", projectId);
+  const bookHref = `/experts/${user.id}/book${bookParams.toString() ? `?${bookParams.toString()}` : ""}`;
```

(`playbookId` takes priority over `projectId` when both are present, since the booking page's implementation mode — Task 10 — is keyed off `playbookId` alone.)

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npx eslint app components lib hooks --max-warnings 0`
Expected: both succeed.

Manually: `npm run dev`, sign in as Demo client, open `/playbooks/playbook_1`. Confirm the "Need help implementing this playbook?" rail only shows experts whose willingness includes "Support with implementation" (cross-check against seed data — several seeded experts have `consulting_engagement` in `willingness`), and that clicking through to an expert's profile and then "Book a consultation" produces a `/experts/[id]/book?playbookId=playbook_1` URL.

- [ ] **Step 6: Commit**

```bash
git add lib/api/experts.ts components/expert/expert-card.tsx components/expert/relevant-experts-panel.tsx "app/(app)/playbooks/[playbookId]/page.tsx" "app/(app)/experts/[expertId]/page.tsx"
git commit -m "Filter the implementation rail to consulting_engagement experts and thread playbookId"
```

---

### Task 10: Booking page implementation mode

**Files:**
- Modify: `app/(app)/experts/[expertId]/book/page.tsx`

**Interfaces:**
- Consumes: `bookImplementationConsultation` (Task 6), `ConsultationMode` (Task 2), `playbooksApi.getPlaybook` (existing).
- Produces: booking with `?playbookId=` in the URL creates an `Engagement` and redirects to its workspace.

- [ ] **Step 1: Add implementation-mode state and the playbook load**

```diff
-import type { Project } from "@/lib/types";
+import type { ConsultationMode, Project, Playbook } from "@/lib/types";
 import * as expertsApi from "@/lib/api/experts";
 import type { ExpertListing } from "@/lib/api/experts";
 import type { AvailableSlot } from "@/lib/api/consultations";
 import * as projectsApi from "@/lib/api/projects";
 import * as consultationsApi from "@/lib/api/consultations";
+import * as playbooksApi from "@/lib/api/playbooks";
 import { useSessionStore } from "@/lib/store/use-session-store";
 import { Avatar } from "@/components/ui/avatar";
 import { Card } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Select, Textarea } from "@/components/ui/input";
 import { Skeleton } from "@/components/ui/skeleton";
 import { ErrorState } from "@/components/ui/error-state";
+import { Video, MapPin } from "@/components/icons";
 import { AvailabilityCalendar } from "@/components/booking/availability-calendar";
 import { describeAvailability } from "@/lib/utils/availability";
```

```diff
   const [listing, setListing] = useState<ExpertListing | null | undefined>(undefined);
   const [eligibleProjects, setEligibleProjects] = useState<Project[]>([]);
   const [projectId, setProjectId] = useState(searchParams.get("projectId") ?? "");
   const [newChallenge, setNewChallenge] = useState("");
+  const playbookId = searchParams.get("playbookId");
+  const isImplementation = Boolean(playbookId);
+  const [playbook, setPlaybook] = useState<Playbook | null | undefined>(undefined);
+  const [mode, setMode] = useState<ConsultationMode>("virtual");
   const [slot, setSlot] = useState<string | null>(null);
```

```diff
   useEffect(() => {
-    if (!user) return;
+    if (!user || isImplementation) return;
     projectsApi.listProjects(user.id).then((projects) => {
       const eligible = projects.filter((p) => !p.consultationId);
       setEligibleProjects(eligible);
       if (!projectId && eligible.length > 0) setProjectId(eligible[0].id);
     });
-  }, [user, projectId]);
+  }, [user, projectId, isImplementation]);
+
+  useEffect(() => {
+    if (!playbookId || !user) return;
+    playbooksApi.getPlaybook(playbookId, user.id).then(setPlaybook);
+  }, [playbookId, user]);
```

- [ ] **Step 2: Update `canBook` and `confirmBooking`**

```diff
   const isNewChallenge = projectId === NEW_CHALLENGE;
-  const canBook = Boolean(slot) && (isNewChallenge ? newChallenge.trim().length > 0 : Boolean(projectId));
+  const canBook =
+    Boolean(slot) && (isImplementation ? true : isNewChallenge ? newChallenge.trim().length > 0 : Boolean(projectId));

   async function confirmBooking() {
     if (!user || !slot || !canBook) return;
     setBooking(true);
     setError(null);
     try {
+      if (isImplementation && playbookId) {
+        const { engagementId } = await consultationsApi.bookImplementationConsultation({
+          playbookId,
+          clientId: user.id,
+          expertId,
+          scheduledFor: slot,
+          mode,
+        });
+        router.push(`/engagements/${engagementId}`);
+        return;
+      }
       const { conversationId } = await consultationsApi.bookConsultation({
         ...(isNewChallenge ? { newChallenge: newChallenge.trim() } : { projectId }),
         clientId: user.id,
         expertId,
         scheduledFor: slot,
       });
-      // Into the conversation rather than the call page: the useful thing to
-      // do between booking and the call is talk to the expert.
       router.push(`/conversations/${conversationId}`);
     } catch (e) {
```

- [ ] **Step 3: Swap the challenge selector for a mode toggle in implementation mode**

Replace the `<Card className="flex flex-col gap-4 p-4">`'s first child (the "Which challenge is this for?" block, including the `isNewChallenge` block right after it) with a branch:

```diff
       <Card className="flex flex-col gap-4 p-4">
-        <div className="flex flex-col gap-1.5">
-          <label className="text-sm font-medium text-gray-300" htmlFor="project">
-            Which challenge is this for?
-          </label>
-          <Select id="project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
-            {eligibleProjects.map((p) => (
-              <option key={p.id} value={p.id}>
-                {p.title}
-              </option>
-            ))}
-            <option value={NEW_CHALLENGE}>A new challenge — we&apos;ll define it on the call</option>
-          </Select>
-        </div>
-
-        {isNewChallenge && (
-          <div className="flex flex-col gap-1.5">
-            <label className="text-sm font-medium text-gray-300" htmlFor="new-challenge">
-              What&apos;s on your mind?
-            </label>
-            <Textarea
-              id="new-challenge"
-              rows={3}
-              value={newChallenge}
-              onChange={(e) => setNewChallenge(e.target.value)}
-              placeholder="A line or two is enough — you'll work through it together on the call."
-            />
-            <p className="text-xs text-gray-500">
-              {expertUser.firstName} will walk you through the questions we&apos;d normally ask, and write up your
-              brief from the conversation.
-            </p>
-          </div>
-        )}
+        {isImplementation ? (
+          <div className="flex flex-col gap-2">
+            <p className="text-sm font-medium text-gray-300">
+              Implementing {playbook === undefined ? "…" : (playbook?.title ?? "this playbook")}
+            </p>
+            <div className="flex gap-2">
+              <Button
+                type="button"
+                size="sm"
+                variant={mode === "virtual" ? "primary" : "outline"}
+                className="gap-1.5"
+                onClick={() => setMode("virtual")}
+              >
+                <Video className="size-3.5" aria-hidden />
+                Virtual call
+              </Button>
+              <Button
+                type="button"
+                size="sm"
+                variant={mode === "on_site" ? "primary" : "outline"}
+                className="gap-1.5"
+                onClick={() => setMode("on_site")}
+              >
+                <MapPin className="size-3.5" aria-hidden />
+                On-site session
+              </Button>
+            </div>
+          </div>
+        ) : (
+          <>
+            <div className="flex flex-col gap-1.5">
+              <label className="text-sm font-medium text-gray-300" htmlFor="project">
+                Which challenge is this for?
+              </label>
+              <Select id="project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
+                {eligibleProjects.map((p) => (
+                  <option key={p.id} value={p.id}>
+                    {p.title}
+                  </option>
+                ))}
+                <option value={NEW_CHALLENGE}>A new challenge — we&apos;ll define it on the call</option>
+              </Select>
+            </div>
+
+            {isNewChallenge && (
+              <div className="flex flex-col gap-1.5">
+                <label className="text-sm font-medium text-gray-300" htmlFor="new-challenge">
+                  What&apos;s on your mind?
+                </label>
+                <Textarea
+                  id="new-challenge"
+                  rows={3}
+                  value={newChallenge}
+                  onChange={(e) => setNewChallenge(e.target.value)}
+                  placeholder="A line or two is enough — you'll work through it together on the call."
+                />
+                <p className="text-xs text-gray-500">
+                  {expertUser.firstName} will walk you through the questions we&apos;d normally ask, and write up
+                  your brief from the conversation.
+                </p>
+              </div>
+            )}
+          </>
+        )}
```

- [ ] **Step 4: Update the submit button label**

```diff
       <Button
         size="lg"
         className="w-full justify-center"
         disabled={!canBook}
         loading={booking}
         onClick={confirmBooking}
       >
-        Confirm consultation
+        {isImplementation ? "Confirm session" : "Confirm consultation"}
       </Button>
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npx eslint app components lib hooks --max-warnings 0`
Expected: both succeed.

Manually: as Demo client, from `/playbooks/playbook_1`'s implementation rail, click an expert, click "Book a consultation" — confirm the page shows the mode toggle (not the challenge selector), pick a time, click "Confirm session", and confirm you land on `/engagements/[id]` (404 is expected until Task 14 — confirm the URL and the redirect happen, that's what this task delivers). Repeat once more with the same expert and confirm no duplicate engagement is implied (this is fully verifiable once Task 13's list page exists — note it here and re-check then).

- [ ] **Step 6: Commit**

```bash
git add "app/(app)/experts/[expertId]/book/page.tsx"
git commit -m "Add implementation-mode branch to the booking page"
```

---

### Task 11: Extract shared `StarRating`

**Files:**
- Create: `components/ui/star-rating.tsx`
- Modify: `components/consultation/consultation-summary.tsx`

**Interfaces:**
- Produces: `StarRating({ value, onChange }): JSX.Element` — used by Task 17.

- [ ] **Step 1: Create the shared component**

```tsx
// components/ui/star-rating.tsx
"use client";

import { Star, StarFilled } from "@/components/icons";

export function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} type="button">
          {n <= value ? <StarFilled className="size-5 text-gold" /> : <Star className="size-5 text-gray-700" />}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Point `consultation-summary.tsx` at it**

```diff
-import { Video, ShieldCheck, Star, StarFilled, HandHeart } from "@/components/icons";
+import { Video, ShieldCheck, HandHeart } from "@/components/icons";
 import type { Consultation, ExpertWillingness, User, Review } from "@/lib/types";
 import * as consultationsApi from "@/lib/api/consultations";
 import * as usersApi from "@/lib/api/users";
 import { useSessionStore } from "@/lib/store/use-session-store";
 import { Avatar } from "@/components/ui/avatar";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Textarea } from "@/components/ui/input";
 import { Checkbox } from "@/components/ui/checkbox";
 import { Skeleton } from "@/components/ui/skeleton";
 import { StatusBadge } from "@/components/ui/status-badge";
+import { StarRating } from "@/components/ui/star-rating";
 import { formatDateTime } from "@/lib/utils/format";
```

```diff
-function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
-  return (
-    <div className="flex gap-1">
-      {[1, 2, 3, 4, 5].map((n) => (
-        <button key={n} onClick={() => onChange(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} type="button">
-          {n <= value ? <StarFilled className="size-5 text-gold" /> : <Star className="size-5 text-gray-700" />}
-        </button>
-      ))}
-    </div>
-  );
-}
-
 /**
  * Everything there is to say about one consultation: what came out of it, the
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npx eslint app components lib hooks --max-warnings 0`
Expected: both succeed.

Manually: as Demo client, open a completed consultation's summary (e.g. via `/conversations`, a thread with a completed call) and confirm the star rating widget still renders and works exactly as before.

- [ ] **Step 4: Commit**

```bash
git add components/ui/star-rating.tsx components/consultation/consultation-summary.tsx
git commit -m "Extract shared StarRating component"
```

---

### Task 12: Extract `ThreadPanel` with file upload

**Files:**
- Create: `components/conversation/thread-panel.tsx`
- Modify: `app/(app)/conversations/[conversationId]/page.tsx`

**Interfaces:**
- Consumes: `ConversationThread` (existing, `lib/api/expert-conversations.ts`), `sendMessage` (existing — already accepts `attachments?: Omit<MessageAttachment, "id"|"uploadedBy">[]`).
- Produces: `ThreadPanel({ conversationId, onThreadLoaded?, beforeMessages?, className? })` — used by Task 14 (engagement workspace chat).

The message-list-and-composer half of the conversation thread page is extracted into a reusable component so the engagement workspace (Task 14) can embed the same chat UI without forking it. The header, "your challenge" card, consultation banner, and "just booked" nudge stay on the page — they're specific to that route — passed into `ThreadPanel` via a `beforeMessages` slot so they still scroll together with the message list exactly as today.

- [ ] **Step 1: Create `ThreadPanel`**

```tsx
// components/conversation/thread-panel.tsx
"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUp, FileText, Upload, X } from "@/components/icons";
import type { ConversationThread } from "@/lib/api/expert-conversations";
import * as conversationsApi from "@/lib/api/expert-conversations";
import { useSessionStore } from "@/lib/store/use-session-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/**
 * The message list + composer for one ExpertConversation thread. Extracted
 * so the same UI can sit inside the full-page /conversations/[id] route and
 * inline inside an engagement workspace, without either forking the other's
 * bug fixes.
 */
export function ThreadPanel({
  conversationId,
  onThreadLoaded,
  beforeMessages,
  className,
}: {
  conversationId: string;
  /** Lets a host read fields off the loaded thread (e.g. for its own header) without duplicating the fetch. */
  onThreadLoaded?: (thread: ConversationThread) => void;
  /** Rendered above the message list, inside the same scroll container. */
  beforeMessages?: ReactNode;
  className?: string;
}) {
  const user = useSessionStore((s) => s.user);
  const [thread, setThread] = useState<ConversationThread | null | undefined>(undefined);
  const [value, setValue] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const result = await conversationsApi.getConversationThread(conversationId, user.id);
    setThread(result);
    if (result) {
      onThreadLoaded?.(result);
      await conversationsApi.markConversationRead(conversationId, user.id);
    }
  }, [conversationId, user, onThreadLoaded]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [thread?.messages.length]);

  async function send() {
    if (!user || sending) return;
    if (!value.trim() && pendingFiles.length === 0) return;
    setSending(true);
    try {
      await conversationsApi.sendMessage({
        conversationId,
        senderId: user.id,
        content: value,
        attachments: pendingFiles.map((f) => ({ name: f.name, mimeType: f.type, sizeBytes: f.size })),
      });
      setValue("");
      setPendingFiles([]);
      await load();
    } finally {
      setSending(false);
    }
  }

  if (thread === undefined) {
    return <div className={cn("min-h-0 flex-1", className)} />;
  }
  if (!thread) {
    return <p className={cn("p-6 text-sm text-gray-500", className)}>This conversation isn&apos;t available.</p>;
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div ref={scrollRef} className="thin-scrollbar min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
          {beforeMessages}

          {thread.messages.filter((m) => m.senderRole !== "system").length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-800 px-4 py-8 text-center">
              <p className="text-sm font-medium text-gray-200">Start the conversation</p>
            </div>
          ) : (
            thread.messages.map((message) => {
              if (message.senderRole === "system") {
                return (
                  <p key={message.id} className="text-center text-xs text-gray-500">
                    {message.content}
                  </p>
                );
              }
              const mine = message.senderId === user?.id;
              return (
                <div key={message.id} className={cn("flex flex-col gap-1", mine && "items-end")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      mine ? "bg-gray-850 text-gray-50" : "bg-gray-900 text-gray-200",
                    )}
                  >
                    {message.content}
                    {message.attachments.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1.5">
                        {message.attachments.map((attachment) => (
                          <span
                            key={attachment.id}
                            className="flex items-center gap-2 rounded-lg border border-gray-800 px-2.5 py-1.5 text-xs text-gray-300"
                          >
                            <FileText className="size-3.5 shrink-0 text-gray-500" aria-hidden />
                            {attachment.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="px-1 text-xs text-gray-500">{mine ? "You" : thread.counterpart.firstName}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-800 px-6 py-4">
        {pendingFiles.length > 0 && (
          <div className="mx-auto mb-2 flex max-w-3xl flex-wrap gap-1.5">
            {pendingFiles.map((f, i) => (
              <span
                key={`${f.name}-${i}`}
                className="flex items-center gap-1.5 rounded-lg border border-gray-800 px-2 py-1 text-xs text-gray-300"
              >
                <FileText className="size-3.5 text-gray-500" aria-hidden />
                {f.name}
                <button
                  type="button"
                  onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="size-3 text-gray-500" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length > 0) setPendingFiles((prev) => [...prev, ...files]);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="rounded-full"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach a file"
          >
            <Upload className="size-4" aria-hidden />
          </Button>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="What would you like to discuss?"
            rows={1}
            disabled={sending}
            className="max-h-32 flex-1 resize-none rounded-2xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-gray-50 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50"
          />
          <Button
            size="icon"
            className="rounded-full"
            loading={sending}
            disabled={!value.trim() && pendingFiles.length === 0}
            onClick={send}
            aria-label="Send message"
          >
            <ArrowUp className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite the conversation page to use it**

Replace the full contents of `app/(app)/conversations/[conversationId]/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight, Video, X } from "@/components/icons";
import type { ConversationThread } from "@/lib/api/expert-conversations";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConsultationSummary } from "@/components/consultation/consultation-summary";
import { StatusBadge } from "@/components/ui/status-badge";
import { ThreadPanel } from "@/components/conversation/thread-panel";
import { formatCallWhen } from "@/lib/utils/format";

export default function ConversationThreadPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [thread, setThread] = useState<ConversationThread | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const isClient = thread?.viewerRole === "client";
  const { counterpart, counterpartProfile, project, consultation } = thread ?? {};

  /**
   * The nudge a client sees right after booking. Derived rather than stored:
   * it shows while a call is scheduled and the client hasn't said anything
   * since booking it, so it clears itself the moment they do — and it never
   * appears for the expert, who doesn't need encouraging to use their own
   * inbox.
   */
  const justBooked =
    isClient &&
    consultation?.status === "scheduled" &&
    !thread?.messages.some((m) => m.senderRole === "client" && m.createdAt > consultation.createdAt);

  return (
    <div className="flex h-full min-w-0">
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-gray-800 px-6 py-4">
          <div className="mx-auto mb-3 max-w-3xl">
            <Link
              href="/conversations"
              className="-ml-1 inline-flex items-center gap-0.5 rounded-md py-0.5 pl-1 pr-2 text-xs text-gray-500 transition-colors hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <ChevronLeft className="size-3.5" aria-hidden />
              Conversations
            </Link>
          </div>
          {counterpart && (
            <div className="mx-auto flex max-w-3xl flex-wrap items-start gap-3">
              <Avatar firstName={counterpart.firstName} lastName={counterpart.lastName} src={counterpart.avatarUrl} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-50">
                  {counterpart.firstName} {counterpart.lastName}
                </p>
                <p className="truncate text-xs text-gray-400">{isClient ? counterpartProfile?.currentRole : "Client"}</p>
                {isClient && counterpartProfile && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {counterpartProfile.expertiseTags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <StatusBadge status={thread!.stage} />
            </div>
          )}
        </header>

        <ThreadPanel
          conversationId={conversationId}
          onThreadLoaded={setThread}
          beforeMessages={
            project && (
              <>
                <Card className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {isClient ? "Your challenge" : "The client's challenge"}
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-gray-100">{project.title}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-gray-400">{project.challenge}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {project.category && <Badge variant="outline">{project.category}</Badge>}
                    <StatusBadge status={project.status} />
                    <Button asChild size="sm" variant="ghost" className="ml-auto gap-1">
                      <Link href={isClient ? `/projects/${project.id}` : `/expert/projects/${project.id}`}>
                        View challenge
                        <ChevronRight className="size-3.5" aria-hidden />
                      </Link>
                    </Button>
                  </div>
                </Card>

                {consultation && consultation.status !== "cancelled" && (
                  <Card className="flex flex-wrap items-center justify-between gap-3 border-primary-500/30 bg-primary-500/5 p-4">
                    <div className="flex items-start gap-2.5">
                      <Calendar className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                      <div>
                        <p className="text-sm font-medium text-gray-100">
                          {consultation.status === "completed" ? "Consultation completed" : "Upcoming consultation"}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">{formatCallWhen(consultation.scheduledFor)}</p>
                      </div>
                    </div>
                    {consultation.status === "completed" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        aria-expanded={summaryOpen}
                        onClick={() => setSummaryOpen((open) => !open)}
                      >
                        <Video className="size-4" aria-hidden />
                        {summaryOpen ? "Hide summary" : "View summary"}
                      </Button>
                    ) : (
                      <Button asChild size="sm" variant="outline" className="gap-1.5">
                        <Link href={`/consultations/${consultation.id}`}>
                          <Video className="size-4" aria-hidden />
                          Join call
                        </Link>
                      </Button>
                    )}
                  </Card>
                )}

                {justBooked && (
                  <Card className="border-primary-500/30 bg-primary-500/5 p-4">
                    <p className="text-sm font-medium text-gray-100">
                      Your call with {counterpart?.firstName} is booked.
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      Share anything useful before you speak — context, documents, what you most want to get out of
                      it. {counterpart?.firstName} can read it beforehand.
                    </p>
                  </Card>
                )}
              </>
            )
          }
        />
      </div>

      {summaryOpen && consultation && (
        <aside
          aria-label="Consultation summary"
          className="fixed inset-0 z-30 flex flex-col border-gray-800 bg-gray-975 lg:static lg:z-auto lg:w-[26rem] lg:shrink-0 lg:border-l"
        >
          <header className="flex shrink-0 items-center gap-3 border-b border-gray-800 px-5 py-4">
            <p className="min-w-0 flex-1 text-sm font-medium text-gray-50">Consultation summary</p>
            <Button size="icon" variant="ghost" className="rounded-full" onClick={() => setSummaryOpen(false)} aria-label="Close summary">
              <X className="size-4" aria-hidden />
            </Button>
          </header>
          <div className="thin-scrollbar flex-1 overflow-y-auto p-5">
            <ConsultationSummary consultationId={consultation.id} variant="panel" />
          </div>
        </aside>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npx eslint app components lib hooks --max-warnings 0`
Expected: both succeed.

Manually: as Demo client, open `/conversations`, click into any thread. Confirm the header, challenge card, consultation banner (if any), message list, and composer all render exactly as before. Click the new attach button in the composer, pick a file, confirm it shows as a removable chip above the composer, send a message with it attached, and confirm the sent message shows the file as an attachment chip. Confirm scrolling and "Enter to send" still work.

- [ ] **Step 4: Commit**

```bash
git add components/conversation/thread-panel.tsx "app/(app)/conversations/[conversationId]/page.tsx"
git commit -m "Extract ThreadPanel and add composer file upload"
```

---

### Task 13: Engagements list page

**Files:**
- Create: `components/engagement/engagement-card.tsx`
- Create: `app/(app)/engagements/page.tsx`

**Interfaces:**
- Consumes: `listEngagementsForClient`, `EngagementListing` (Task 5).
- Produces: `/engagements` route, `EngagementCard` component (also reused nowhere else — self-contained).

- [ ] **Step 1: Create the card**

```tsx
// components/engagement/engagement-card.tsx
import Link from "next/link";
import type { EngagementListing } from "@/lib/api/engagements";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRelative } from "@/lib/utils/format";

export function EngagementCard({ listing }: { listing: EngagementListing }) {
  const { engagement, counterpart, playbookTitle } = listing;
  return (
    <Link href={`/engagements/${engagement.id}`} className="block">
      <Card className="flex flex-col gap-3 p-4 transition-colors hover:bg-gray-900">
        <div className="flex items-center gap-3">
          <Avatar firstName={counterpart.firstName} lastName={counterpart.lastName} src={counterpart.avatarUrl} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-50">
              {counterpart.firstName} {counterpart.lastName}
            </p>
            <p className="truncate text-xs text-gray-400">{playbookTitle}</p>
          </div>
          <StatusBadge status={engagement.status} />
        </div>
        {engagement.status === "pending_completion" && <Badge variant="outline">Completion proposed</Badge>}
        <p className="text-xs text-gray-500">Updated {formatRelative(engagement.updatedAt)}</p>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Create the list page**

```tsx
// app/(app)/engagements/page.tsx
"use client";

import { useEffect, useState } from "react";
import * as engagementsApi from "@/lib/api/engagements";
import type { EngagementListing } from "@/lib/api/engagements";
import { EngagementCard } from "@/components/engagement/engagement-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionStore } from "@/lib/store/use-session-store";

type Bucket = "in_progress" | "rating" | "completed";

function bucketOf(listing: EngagementListing): Bucket {
  if (listing.engagement.status !== "completed") return "in_progress";
  return listing.myReview ? "completed" : "rating";
}

const BUCKETS: [Bucket, string][] = [
  ["in_progress", "In progress"],
  ["rating", "Rating"],
  ["completed", "Completed"],
];

export default function EngagementsPage() {
  const user = useSessionStore((s) => s.user);
  const [listings, setListings] = useState<EngagementListing[] | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    engagementsApi.listEngagementsForClient(user.id).then(setListings);
  }, [user]);

  if (listings === undefined) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-50">Projects</h1>
        <p className="mt-1 text-sm text-gray-400">Experts helping you put your playbooks into practice.</p>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          title="No implementation projects yet"
          description="Book time with an expert from a finished playbook's implementation panel to start one."
        />
      ) : (
        BUCKETS.map(([key, label]) => {
          const items = listings.filter((l) => bucketOf(l) === key);
          if (items.length === 0) return null;
          return (
            <div key={key}>
              <h2 className="mb-3 text-sm font-medium text-gray-300">{label}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((listing) => (
                  <EngagementCard key={listing.engagement.id} listing={listing} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npx eslint app components lib hooks --max-warnings 0`
Expected: both succeed.

Manually: as Demo client, click "Projects" in the sidebar. If you booked implementation sessions in Task 10's manual check, confirm they show under "In progress" grouped correctly; otherwise confirm the empty state renders. Book a fresh implementation session now if you haven't, and confirm it appears here immediately after redirect (even though the destination page still 404s until Task 14 — navigate back to `/engagements` to see the card).

- [ ] **Step 4: Commit**

```bash
git add components/engagement/engagement-card.tsx "app/(app)/engagements/page.tsx"
git commit -m "Add engagements list page with In progress/Rating/Completed buckets"
```

---

### Task 14: Engagement workspace — header, completion actions, chat

**Files:**
- Create: `components/engagement/engagement-header.tsx`
- Create: `app/(app)/engagements/[engagementId]/page.tsx`

**Interfaces:**
- Consumes: `getEngagement`, `EngagementDetail` (Task 5), `proposeCompletion`, `confirmCompletion`, `retractCompletionProposal` (Task 7), `ThreadPanel` (Task 12).
- Produces: `/engagements/[engagementId]` route rendering header + chat (schedule/files/rating added in Tasks 15–17).

- [ ] **Step 1: Create the header**

```tsx
// components/engagement/engagement-header.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import type { Engagement } from "@/lib/types";
import type { EngagementDetail } from "@/lib/api/engagements";
import * as engagementsApi from "@/lib/api/engagements";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

export function EngagementHeader({
  detail,
  onChange,
}: {
  detail: EngagementDetail;
  onChange: (engagement: Engagement) => void;
}) {
  const [busy, setBusy] = useState(false);
  const { engagement, counterpart, playbook, viewerRole } = detail;
  const viewerId = viewerRole === "client" ? engagement.clientId : engagement.expertId;

  async function propose() {
    setBusy(true);
    try {
      onChange(await engagementsApi.proposeCompletion(engagement.id, viewerId));
    } finally {
      setBusy(false);
    }
  }
  async function confirm() {
    setBusy(true);
    try {
      onChange(await engagementsApi.confirmCompletion(engagement.id, viewerId));
    } finally {
      setBusy(false);
    }
  }
  async function retract() {
    setBusy(true);
    try {
      onChange(await engagementsApi.retractCompletionProposal(engagement.id, viewerId));
    } finally {
      setBusy(false);
    }
  }

  const iProposed = engagement.status === "pending_completion" && engagement.completionProposedBy === viewerRole;

  return (
    <header className="shrink-0 border-b border-gray-800 px-6 py-4">
      <div className="mb-3">
        <Link
          href="/engagements"
          className="-ml-1 inline-flex items-center gap-0.5 rounded-md py-0.5 pl-1 pr-2 text-xs text-gray-500 hover:text-gray-300"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          Projects
        </Link>
      </div>
      <div className="flex flex-wrap items-start gap-3">
        <Avatar firstName={counterpart.firstName} lastName={counterpart.lastName} src={counterpart.avatarUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-50">
            {counterpart.firstName} {counterpart.lastName}
          </p>
          <Link
            href={`/playbooks/${playbook.id}`}
            className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-300"
          >
            {playbook.title}
            <ChevronRight className="size-3" aria-hidden />
          </Link>
        </div>
        <StatusBadge status={engagement.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {engagement.status === "in_progress" && (
          <Button size="sm" variant="outline" loading={busy} onClick={propose}>
            Mark as complete
          </Button>
        )}
        {engagement.status === "pending_completion" && iProposed && (
          <>
            <p className="text-xs text-gray-400">Waiting for {counterpart.firstName} to confirm.</p>
            <Button size="sm" variant="ghost" loading={busy} onClick={retract}>
              Retract
            </Button>
          </>
        )}
        {engagement.status === "pending_completion" && !iProposed && (
          <>
            <Button size="sm" loading={busy} onClick={confirm}>
              Confirm completion
            </Button>
            <Button size="sm" variant="ghost" loading={busy} onClick={retract}>
              Not yet — keep going
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create the workspace page**

```tsx
// app/(app)/engagements/[engagementId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import * as engagementsApi from "@/lib/api/engagements";
import type { EngagementDetail } from "@/lib/api/engagements";
import { EngagementHeader } from "@/components/engagement/engagement-header";
import { ThreadPanel } from "@/components/conversation/thread-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useSessionStore } from "@/lib/store/use-session-store";

export default function EngagementWorkspacePage() {
  const { engagementId } = useParams<{ engagementId: string }>();
  const user = useSessionStore((s) => s.user);
  const [detail, setDetail] = useState<EngagementDetail | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    engagementsApi.getEngagement(engagementId, user.id).then(setDetail);
  }, [engagementId, user]);

  if (detail === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <ErrorState whatHappened="We couldn't find this project." dataSafe="Nothing has been lost." />
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-col">
      <EngagementHeader detail={detail} onChange={(engagement) => setDetail({ ...detail, engagement })} />
      <div className="flex min-h-0 flex-1">
        <ThreadPanel conversationId={detail.engagement.conversationId} className="min-h-0 flex-1" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npx eslint app components lib hooks --max-warnings 0`
Expected: both succeed.

Manually: as Demo client, open `/engagements`, click into a card. Confirm the header shows the expert, playbook link, status badge, "Mark as complete" button, and the chat panel below it works (send a message). Click "Mark as complete", confirm the button changes to "Waiting for … to confirm" and the status badge updates to "Pending completion". Open the same URL signed in as the expert (Demo expert, if that's who was booked, or Demo dual-role) and confirm "Confirm completion" / "Not yet — keep going" appear instead, and that confirming flips the status to "Completed" on both sides after a refresh.

- [ ] **Step 4: Commit**

```bash
git add components/engagement/engagement-header.tsx "app/(app)/engagements/[engagementId]/page.tsx"
git commit -m "Add engagement workspace page with header and chat"
```

---

### Task 15: Workspace — schedule log

**Files:**
- Create: `components/engagement/engagement-schedule-log.tsx`
- Modify: `app/(app)/engagements/[engagementId]/page.tsx`

**Interfaces:**
- Consumes: `listConsultationsForClient`, `listConsultationsForExpert` (existing, `lib/api/consultations.ts`), `completeOnSiteSession` (Task 6).
- Produces: `EngagementScheduleLog({ engagementId, clientId, expertId })`, wired into the workspace's new right-hand aside.

- [ ] **Step 1: Create the schedule log**

```tsx
// components/engagement/engagement-schedule-log.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Video } from "@/components/icons";
import type { Consultation } from "@/lib/types";
import * as consultationsApi from "@/lib/api/consultations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCallWhen } from "@/lib/utils/format";

export function EngagementScheduleLog({
  engagementId,
  clientId,
  expertId,
}: {
  engagementId: string;
  clientId: string;
  expertId: string;
}) {
  const [consultations, setConsultations] = useState<Consultation[] | undefined>(undefined);

  const load = useCallback(async () => {
    const [client, expert] = await Promise.all([
      consultationsApi.listConsultationsForClient(clientId),
      consultationsApi.listConsultationsForExpert(expertId),
    ]);
    setConsultations([...client, ...expert].filter((c) => c.engagementId === engagementId));
  }, [engagementId, clientId, expertId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!consultations || consultations.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-medium uppercase tracking-wide text-gray-500">Schedule</h2>
      {consultations.map((c) => (
        <Card key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-2.5">
            {c.mode === "virtual" ? (
              <Video className="size-4 text-gray-500" aria-hidden />
            ) : (
              <MapPin className="size-4 text-gray-500" aria-hidden />
            )}
            <div>
              <p className="text-sm text-gray-100">{c.mode === "virtual" ? "Virtual call" : "On-site session"}</p>
              <p className="text-xs text-gray-500">{formatCallWhen(c.scheduledFor)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={c.status} />
            {c.mode === "on_site" && c.status === "scheduled" && (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await consultationsApi.completeOnSiteSession(c.id);
                  load();
                }}
              >
                Mark session complete
              </Button>
            )}
            {c.mode === "virtual" && c.status !== "completed" && c.status !== "cancelled" && (
              <Button asChild size="sm" variant="outline">
                <Link href={`/consultations/${c.id}`}>Open</Link>
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Wire it into the workspace page's new aside**

```diff
   return (
     <div className="flex h-full min-w-0 flex-col">
       <EngagementHeader detail={detail} onChange={(engagement) => setDetail({ ...detail, engagement })} />
       <div className="flex min-h-0 flex-1">
         <ThreadPanel conversationId={detail.engagement.conversationId} className="min-h-0 flex-1" />
+        <aside className="hidden w-80 shrink-0 flex-col gap-5 overflow-y-auto border-l border-gray-800 p-5 lg:flex">
+          <EngagementScheduleLog
+            engagementId={detail.engagement.id}
+            clientId={detail.engagement.clientId}
+            expertId={detail.engagement.expertId}
+          />
+        </aside>
       </div>
     </div>
   );
```

Add the import:

```diff
 import { EngagementHeader } from "@/components/engagement/engagement-header";
+import { EngagementScheduleLog } from "@/components/engagement/engagement-schedule-log";
 import { ThreadPanel } from "@/components/conversation/thread-panel";
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npx eslint app components lib hooks --max-warnings 0`
Expected: both succeed.

Manually: on a wide viewport, open an engagement with at least one booked session — confirm it shows in the new right-hand rail with the correct mode icon, time, and status. For an on-site session still `scheduled`, click "Mark session complete" and confirm its status badge updates without a page reload. For a virtual session, confirm "Open" links to `/consultations/[id]`.

- [ ] **Step 4: Commit**

```bash
git add components/engagement/engagement-schedule-log.tsx "app/(app)/engagements/[engagementId]/page.tsx"
git commit -m "Add engagement schedule log with on-site completion"
```

---

### Task 16: Workspace — files list

**Files:**
- Create: `components/engagement/engagement-files.tsx`
- Modify: `app/(app)/engagements/[engagementId]/page.tsx`

**Interfaces:**
- Consumes: `listAttachmentsForEngagement`, `EngagementAttachment` (Task 5).
- Produces: `EngagementFiles({ engagementId, viewerId })`, wired into the workspace aside below the schedule log.

- [ ] **Step 1: Create the files list**

```tsx
// components/engagement/engagement-files.tsx
"use client";

import { useEffect, useState } from "react";
import { FileText } from "@/components/icons";
import * as engagementsApi from "@/lib/api/engagements";
import type { EngagementAttachment } from "@/lib/api/engagements";
import { formatRelative } from "@/lib/utils/format";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EngagementFiles({ engagementId, viewerId }: { engagementId: string; viewerId: string }) {
  const [files, setFiles] = useState<EngagementAttachment[] | undefined>(undefined);

  useEffect(() => {
    engagementsApi.listAttachmentsForEngagement(engagementId, viewerId).then(setFiles);
  }, [engagementId, viewerId]);

  if (!files || files.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-medium uppercase tracking-wide text-gray-500">Files</h2>
      <div className="flex flex-col gap-1.5">
        {files.map(({ attachment, createdAt }) => (
          <div
            key={attachment.id}
            className="flex items-center gap-2 rounded-lg border border-gray-800 px-2.5 py-2 text-xs"
          >
            <FileText className="size-3.5 shrink-0 text-gray-500" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-gray-200">{attachment.name}</p>
              <p className="text-gray-500">
                {formatSize(attachment.sizeBytes)} · {formatRelative(createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire it into the aside**

```diff
         <aside className="hidden w-80 shrink-0 flex-col gap-5 overflow-y-auto border-l border-gray-800 p-5 lg:flex">
           <EngagementScheduleLog
             engagementId={detail.engagement.id}
             clientId={detail.engagement.clientId}
             expertId={detail.engagement.expertId}
           />
+          <EngagementFiles engagementId={detail.engagement.id} viewerId={user.id} />
         </aside>
```

```diff
 import { EngagementScheduleLog } from "@/components/engagement/engagement-schedule-log";
+import { EngagementFiles } from "@/components/engagement/engagement-files";
```

(`user` is already in scope from `useSessionStore` and is non-null at this point in the render, since `detail` only loaded after `user` existed.)

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npx eslint app components lib hooks --max-warnings 0`
Expected: both succeed.

Manually: send a message with a file attached from the workspace's chat panel (added in Task 12/14), then confirm it appears in the "Files" section of the right-hand rail with the correct size and relative time.

- [ ] **Step 4: Commit**

```bash
git add components/engagement/engagement-files.tsx "app/(app)/engagements/[engagementId]/page.tsx"
git commit -m "Add engagement files list"
```

---

### Task 17: Workspace — rating section

**Files:**
- Create: `components/engagement/engagement-rating.tsx`
- Modify: `app/(app)/engagements/[engagementId]/page.tsx`

**Interfaces:**
- Consumes: `submitEngagementReview` (Task 7), `StarRating` (Task 11).
- Produces: `EngagementRating({ detail, onSubmitted })`, wired into the workspace aside, shown only when `status === "completed"`.

- [ ] **Step 1: Create the rating section**

```tsx
// components/engagement/engagement-rating.tsx
"use client";

import { useState } from "react";
import type { EngagementReview } from "@/lib/types";
import type { EngagementDetail } from "@/lib/api/engagements";
import * as engagementsApi from "@/lib/api/engagements";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { StarRating } from "@/components/ui/star-rating";

export function EngagementRating({
  detail,
  onSubmitted,
}: {
  detail: EngagementDetail;
  onSubmitted: (review: EngagementReview) => void;
}) {
  const { engagement, counterpart, viewerRole, myReview, otherReview } = detail;
  const viewerId = viewerRole === "client" ? engagement.clientId : engagement.expertId;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const review = await engagementsApi.submitEngagementReview({
        engagementId: engagement.id,
        fromUserId: viewerId,
        toUserId: counterpart.id,
        rating,
        comment: comment || undefined,
      });
      onSubmitted(review);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-medium uppercase tracking-wide text-gray-500">Rating</h2>
      {myReview ? (
        <Card className="p-3 text-sm text-gray-300">
          You rated {counterpart.firstName} {myReview.rating} / 5.
          {myReview.comment && <p className="mt-1 text-gray-400">{myReview.comment}</p>}
        </Card>
      ) : (
        <Card className="flex flex-col gap-3 p-3">
          <StarRating value={rating} onChange={setRating} />
          <Textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional comment..." />
          <Button size="sm" loading={submitting} disabled={!rating} onClick={submit}>
            Submit rating
          </Button>
        </Card>
      )}
      {otherReview && (
        <p className="text-xs text-gray-500">
          {counterpart.firstName} rated this {otherReview.rating} / 5.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire it into the aside, completed-only**

```diff
           <EngagementFiles engagementId={detail.engagement.id} viewerId={user.id} />
+          {detail.engagement.status === "completed" && (
+            <EngagementRating
+              detail={detail}
+              onSubmitted={(review) => setDetail({ ...detail, myReview: review })}
+            />
+          )}
         </aside>
```

```diff
 import { EngagementFiles } from "@/components/engagement/engagement-files";
+import { EngagementRating } from "@/components/engagement/engagement-rating";
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npx eslint app components lib hooks --max-warnings 0`
Expected: both succeed.

Manually: bring an engagement to `completed` (propose + confirm, from Task 14's check). Confirm the "Rating" section appears in the aside with a star picker; submit a rating and confirm it switches to the read-only "You rated … X / 5" card. Go back to `/engagements` and confirm this engagement now shows under "Completed" for the reviewer and still under "Rating" for the other party (who hasn't rated yet). Sign in as the other party, submit their rating, and confirm both sides now show "Completed" and each can see the other's rating.

- [ ] **Step 4: Commit**

```bash
git add components/engagement/engagement-rating.tsx "app/(app)/engagements/[engagementId]/page.tsx"
git commit -m "Add engagement rating section"
```

---

### Task 18: Expert-side Engagements section

**Files:**
- Modify: `app/(app)/expert/projects/[projectId]/page.tsx`

**Interfaces:**
- Consumes: `listEngagementsForExpert`, `EngagementListing` (Task 5).
- Produces: an "Engagements" card on the expert's existing project page, filtered to that project's playbooks.

No new expert nav item — the existing "Projects" tab keeps meaning the diagnostic `Project`. Engagements tied to a project's playbooks show as a section on that project's existing page instead.

- [ ] **Step 1: Load the expert's engagements alongside the existing data**

```diff
 import * as opportunitiesApi from "@/lib/api/opportunities";
 import * as liveBriefsApi from "@/lib/api/live-briefs";
 import * as expertApi from "@/lib/api/expert-onboarding";
+import * as engagementsApi from "@/lib/api/engagements";
+import type { EngagementListing } from "@/lib/api/engagements";
```

```diff
   const [contributions, setContributions] = useState<ExpertContribution[]>([]);
+  const [engagements, setEngagements] = useState<EngagementListing[]>([]);
   const [listing, setListing] = useState<opportunitiesApi.OpportunityListing | null>(null);
```

```diff
-      const [p, expertProfile, opps, myContributions] = await Promise.all([
+      const [p, expertProfile, opps, myContributions, myEngagements] = await Promise.all([
         projectsApi.getProject(projectId),
         expertApi.getExpertProfile(user.id),
         opportunitiesApi.listOpportunities(user.id),
         contributionsApi.listContributionsByExpert(user.id),
+        engagementsApi.listEngagementsForExpert(user.id),
       ]);
       if (cancelled) return;

       setProject(p);
       setProfile(expertProfile);
       setListing(opps.find((l) => l.opportunity.projectId === projectId) ?? null);
       setContributions(myContributions.filter((c) => c.projectId === projectId));
+      setEngagements(myEngagements.filter((e) => e.engagement.projectId === projectId));
```

- [ ] **Step 2: Render the section**

Insert after the "Your contributions to this project" `Card` (right before the "Final playbook" `{finalState && (...)}` block):

```diff
             </CardContent>
           </Card>

+          {engagements.length > 0 && (
+            <Card>
+              <CardHeader>
+                <CardTitle>Engagements</CardTitle>
+              </CardHeader>
+              <CardContent className="flex flex-col gap-2">
+                {engagements.map(({ engagement, playbookTitle }) => (
+                  <Link
+                    key={engagement.id}
+                    href={`/engagements/${engagement.id}`}
+                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 px-3 py-2.5 text-sm hover:bg-gray-900"
+                  >
+                    <span className="text-gray-200">{playbookTitle}</span>
+                    <StatusBadge status={engagement.status} />
+                  </Link>
+                ))}
+              </CardContent>
+            </Card>
+          )}
+
           {/*
             Several experts can be drafting the same brief at once, so this is
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npx eslint app components lib hooks --max-warnings 0`
Expected: both succeed.

Manually: as the expert who booked an implementation session earlier (e.g. Demo expert or Demo dual-role), open `/expert/projects/project_1` (or whichever project the playbook belongs to). Confirm an "Engagements" card appears listing the playbook title and status badge, and that clicking it opens the same `/engagements/[id]` workspace page seen from the client side.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/expert/projects/[projectId]/page.tsx"
git commit -m "Add Engagements section to the expert project page"
```

---

## Self-Review

**Spec coverage:**
- Trigger CTA reusing the existing implementation panel, filtered by `consulting_engagement` → Task 9.
- Simplified 3-state pipeline (In Progress / Completed / Rating, Rating derived) → Tasks 1, 5, 13.
- Completion proposed-by-one-confirmed-by-other → Task 7, 14.
- True two-way rating → Task 7, 17.
- Multiple concurrent engagements per playbook (different experts) → `getOrCreateEngagementWithin`'s `(clientId, expertId, playbookId)` key, Task 5.
- Virtual + on-site tracking → Task 2 (`ConsultationMode`), Task 6, 10, 15.
- Workspace: chat/files/schedule → Tasks 12, 14, 15, 16.
- Catalog-playbook scope limitation → Task 6 Step 2 (explicit `ApiError` when `playbook.projectId` is missing).
- Client nav "Projects" tab, no expert nav collision → Task 8, 18.
- `pending_completion` status badge → Task 8.
- Storage key bump → Task 3.

**Placeholder scan:** No TBD/TODO markers; every step has real code or an exact manual-verification procedure naming specific demo accounts and URLs.

**Type consistency:** `Engagement`/`EngagementReview`/`EngagementStatus` (Task 1) are used identically in every later task. `EngagementListing`/`EngagementDetail`/`EngagementAttachment` (Task 5) match their usage in Tasks 13–18 exactly (field names `engagement`, `counterpart`, `counterpartProfile`, `playbookTitle`, `myReview`, `otherReview`, `playbook`, `viewerRole` are consistent everywhere they're read). `ConsultationMode` (Task 2) matches its use in Task 6 and 10. `proposeCompletion`/`confirmCompletion`/`retractCompletionProposal`/`submitEngagementReview` (Task 7) signatures match their call sites in Task 14 and 17 exactly (`(engagementId, userId)` and the review input object shape).

---

Plan complete and saved to `docs/superpowers/plans/2026-08-28-client-projects-tab.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
