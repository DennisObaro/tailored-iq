# Unified Conversations Inbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the expert-only "Calls" page into the shared "Conversations" inbox so both roles see one recency-sorted list of threads, each row showing a message preview or whatever's most relevant about a linked call (scheduled/live/completed), and remove the redundant "Calls" nav entry.

**Architecture:** No new data model. `ExpertConversation` already links to its `Consultation` via `consultationId` (backfilled lazily by existing code). We extend the API's `ConversationListing` DTO to expose the linked consultation's id/status/scheduledFor, add one sort rule (live calls float to the top), then update the one shared list page's row markup to show a call-aware preview and an optional "Join call"/"View summary" action button. Nav and two small route/breadcrumb touch-ups follow.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind v4, no test runner (verification is `tsc --noEmit` + `eslint` + `npm run build` + manual browser check).

**Spec:** `docs/superpowers/specs/2026-08-22-unified-conversations-inbox-design.md`

## Global Constraints

- No test suite exists in this repo. Each task's verification step is `npx tsc --noEmit` and `npx eslint app components lib hooks --max-warnings 0`, not a test run — do not write `*.test.*` files. UI-facing tasks additionally require a manual check in the browser (`npm run dev`, drive it, or use browser automation) before being considered done.
- Pages/components import only from `lib/api/*`, never `lib/mock-data/*` or `lib/ai-sim/*` directly.
- `ConversationListing` is a computed read-time DTO, not a stored table — adding a field to it is not a `Database` shape change, so the `tiq_db_v6` localStorage key does **not** need bumping for this work.
- No new `ExpertConversationStage` value and no new `StatusBadge`/`STATUS_LABELS` entries are needed — `scheduled`, `in_call`, `completed`, `consultation_scheduled`, `consultation_completed` are all already defined in `components/ui/status-badge.tsx`.
- Where a list row must stay a single click target for "open the thread" while also carrying a separate "Join call" button, use the stretched-link pattern: the row container is `relative`; an absolutely-positioned `<Link className="absolute inset-0 z-10">` covers the whole row; the action `Button` (which wraps its own `Link` via `asChild`) gets `relative z-20` so it hit-tests above the overlay. Do not nest an `<a>` inside another `<a>`.
- Commit after each task with the working tree passing `tsc --noEmit` and lint.

---

### Task 1: Expose consultation detail on `ConversationListing` and sort live calls first

**Files:**
- Modify: `lib/api/expert-conversations.ts:16-26` (the `ConversationListing` interface), `:41-50` (`stageFor`), `:170-204` (`listConversationsForUser`), `:211-251` (`getConversationThread`)

**Interfaces:**
- Consumes: existing `Database.consultations`, `Database.expertConversations` (`lib/api/_db.ts`), `Consultation` and `ExpertConversation`/`ExpertConversationStage` types (`lib/types`).
- Produces: `ConversationListing.consultation?: Pick<Consultation, "id" | "status" | "scheduledFor">` — Task 2's UI reads this field. `listConversationsForUser` now returns listings with any `status: "in_call"` consultation sorted before all others, otherwise unchanged recency order.

- [ ] **Step 1: Add a shared `consultationFor` helper and change `stageFor` to take the consultation instead of re-deriving it**

Replace the current `stageFor` function (`lib/api/expert-conversations.ts:41-50`):

```ts
function stageFor(d: Database, conversation: ExpertConversation): ExpertConversationStage {
  if (conversation.status === "archived") return "archived";
  const consultation = conversation.consultationId
    ? d.consultations.find((c) => c.id === conversation.consultationId)
    : undefined;
  if (!consultation) return "active";
  if (consultation.status === "completed") return "consultation_completed";
  if (consultation.status === "cancelled") return "active";
  return "consultation_scheduled";
}
```

with:

```ts
function consultationFor(d: Database, conversation: ExpertConversation): Consultation | undefined {
  return conversation.consultationId
    ? d.consultations.find((c) => c.id === conversation.consultationId)
    : undefined;
}

function stageFor(
  conversation: ExpertConversation,
  consultation: Consultation | undefined,
): ExpertConversationStage {
  if (conversation.status === "archived") return "archived";
  if (!consultation) return "active";
  if (consultation.status === "completed") return "consultation_completed";
  if (consultation.status === "cancelled") return "active";
  return "consultation_scheduled";
}
```

- [ ] **Step 2: Add the `consultation` field to `ConversationListing`**

Change the interface at `lib/api/expert-conversations.ts:17-26`:

```ts
export interface ConversationListing {
  conversation: ExpertConversation;
  counterpart: User;
  counterpartProfile?: ExpertProfile;
  projectTitle: string;
  stage: ExpertConversationStage;
  lastMessage?: ConversationMessage;
  unreadCount: number;
  consultation?: Pick<Consultation, "id" | "status" | "scheduledFor">;
}
```

- [ ] **Step 3: Update `listConversationsForUser` to resolve the consultation once, populate the new field, and sort live calls first**

Replace the function body (`lib/api/expert-conversations.ts:170-204`):

```ts
export async function listConversationsForUser(userId: string): Promise<ConversationListing[]> {
  return simulateNetwork(
    () => {
      const database = db.get();
      return database.expertConversations
        .filter((c) => c.clientId === userId || c.expertId === userId)
        .map((conversation): ConversationListing | null => {
          const counterpartId =
            conversation.clientId === userId ? conversation.expertId : conversation.clientId;
          const counterpart = database.users.find((u) => u.id === counterpartId);
          const project = database.projects.find((p) => p.id === conversation.projectId);
          if (!counterpart || !project) return null;

          const messages = messagesIn(database, conversation.id);
          const consultation = consultationFor(database, conversation);
          return {
            conversation,
            counterpart,
            counterpartProfile: database.expertProfiles.find((p) => p.userId === counterpartId),
            projectTitle: project.title,
            stage: stageFor(conversation, consultation),
            lastMessage: messages[messages.length - 1],
            unreadCount: messages.filter((m) => m.senderId !== userId && m.senderRole !== "system" && !m.readAt)
              .length,
            consultation: consultation
              ? { id: consultation.id, status: consultation.status, scheduledFor: consultation.scheduledFor }
              : undefined,
          };
        })
        .filter((x): x is ConversationListing => x !== null)
        .sort((a, b) => {
          const aLive = a.consultation?.status === "in_call";
          const bLive = b.consultation?.status === "in_call";
          if (aLive !== bLive) return aLive ? -1 : 1;
          const at = a.lastMessage?.createdAt ?? a.conversation.updatedAt;
          const bt = b.lastMessage?.createdAt ?? b.conversation.updatedAt;
          return at < bt ? 1 : -1;
        });
    },
    { latency: [120, 260] },
  );
}
```

- [ ] **Step 4: Update `getConversationThread` to use the new `stageFor` signature and reuse its own consultation lookup**

Replace the function body (`lib/api/expert-conversations.ts:211-251`):

```ts
export async function getConversationThread(
  conversationId: string,
  viewerId: string,
): Promise<ConversationThread | null> {
  return simulateNetwork(
    () => {
      const database = db.get();
      if (!canViewExpertConversation(database, conversationId, viewerId)) return null;

      const conversation = database.expertConversations.find((c) => c.id === conversationId);
      if (!conversation) return null;
      const project = database.projects.find((p) => p.id === conversation.projectId);
      if (!project) return null;

      const viewerRole = conversation.clientId === viewerId ? "client" : "expert";
      const counterpartId = viewerRole === "client" ? conversation.expertId : conversation.clientId;
      const counterpart = database.users.find((u) => u.id === counterpartId);
      if (!counterpart) return null;

      const consultation = consultationFor(database, conversation);
      return {
        conversation,
        counterpart,
        counterpartProfile: database.expertProfiles.find((p) => p.userId === counterpartId),
        messages: messagesIn(database, conversationId),
        stage: stageFor(conversation, consultation),
        project: {
          id: project.id,
          title: project.title,
          challenge: project.challenge,
          category: project.category,
          status: project.status,
        },
        consultation,
        viewerRole,
      };
    },
    { latency: [100, 220] },
  );
}
```

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no errors in `lib/api/expert-conversations.ts` (pre-existing unrelated errors elsewhere, if any, are not this task's concern — confirm none are newly introduced by this diff).

Run: `npx eslint lib/api/expert-conversations.ts --max-warnings 0`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add lib/api/expert-conversations.ts
git commit -m "Expose linked consultation detail on ConversationListing, sort live calls first"
```

---

### Task 2: Merge call rows into the `/conversations` list page

**Files:**
- Modify: `app/(app)/conversations/page.tsx`

**Interfaces:**
- Consumes: `ConversationListing` (now including `consultation?: Pick<Consultation, "id" | "status" | "scheduledFor">` from Task 1), `formatCallWhen`/`formatRelative` (`lib/utils/format.ts`), `Button` (`components/ui/button.tsx`, variants `"primary" | "outline"`, `asChild` prop).
- Produces: nothing consumed by later tasks — this is the UI leaf.

- [ ] **Step 1: Add the `formatCallWhen` import alongside the existing `formatRelative` import**

At `app/(app)/conversations/page.tsx:15`, change:

```ts
import { formatRelative } from "@/lib/utils/format";
```

to:

```ts
import { formatRelative, formatCallWhen } from "@/lib/utils/format";
```

- [ ] **Step 2: Add two module-level helper functions above the component**

Insert after the imports, before `export default function ConversationsPage()`:

```ts
function previewFor(listing: ConversationListing, viewerId: string | undefined) {
  if (listing.lastMessage) {
    const prefix =
      listing.lastMessage.senderRole === "system"
        ? ""
        : listing.lastMessage.senderId === viewerId
          ? "You: "
          : "";
    return `${prefix}${listing.lastMessage.content}`;
  }
  switch (listing.consultation?.status) {
    case "scheduled":
      return `Call scheduled for ${formatCallWhen(listing.consultation.scheduledFor)}`;
    case "in_call":
      return "Call in progress";
    case "completed":
      return "Call completed";
    default:
      return "No messages yet.";
  }
}

function callActionFor(status: string): { label: string; variant: "primary" | "outline" } | null {
  switch (status) {
    case "scheduled":
      return { label: "Join call", variant: "primary" };
    case "in_call":
      return { label: "Rejoin call", variant: "primary" };
    case "completed":
      return { label: "View summary", variant: "outline" };
    default:
      return null;
  }
}
```

- [ ] **Step 3: Update the page description copy**

Change (`app/(app)/conversations/page.tsx:32-36`):

```tsx
<p className="mt-1 text-sm text-gray-400">
  {isExpertView
    ? "Clients you're working with, and the challenge behind each one."
    : "Where you and an expert work through one of your challenges."}
</p>
```

to:

```tsx
<p className="mt-1 text-sm text-gray-400">
  {isExpertView
    ? "Clients you're working with — messages and scheduled calls, in one place."
    : "Where you and an expert work through one of your challenges."}
</p>
```

- [ ] **Step 4: Replace the row markup to add the stretched-link overlay, call-aware preview, and action button**

Replace the `listings.map(...)` block (`app/(app)/conversations/page.tsx:60-110`):

```tsx
{listings.map((listing) => {
  const unread = listing.unreadCount > 0;
  const consultation = listing.consultation;
  const isLive = consultation?.status === "in_call";
  const action = consultation ? callActionFor(consultation.status) : null;
  return (
    <Card
      key={listing.conversation.id}
      className={cn(
        "relative flex items-start gap-3 p-4 transition-colors hover:bg-gray-900",
        unread && "border-primary-500/30",
        isLive && "border-primary-500/60",
      )}
    >
      <Link
        href={`/conversations/${listing.conversation.id}`}
        className="absolute inset-0 z-10"
        aria-label={`Open conversation with ${listing.counterpart.firstName} ${listing.counterpart.lastName}`}
      />
      <Avatar
        firstName={listing.counterpart.firstName}
        lastName={listing.counterpart.lastName}
        src={listing.counterpart.avatarUrl}
        size="lg"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("truncate text-sm text-gray-100", unread && "font-medium text-gray-50")}>
            {listing.counterpart.firstName} {listing.counterpart.lastName}
          </p>
          <span className="shrink-0 text-xs text-gray-500">
            {isLive
              ? "Live now"
              : formatRelative(listing.lastMessage?.createdAt ?? listing.conversation.updatedAt)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-gray-400">{listing.projectTitle}</p>
        <p className={cn("mt-1.5 truncate text-sm", unread ? "text-gray-200" : "text-gray-500")}>
          {previewFor(listing, user?.id)}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <StatusBadge status={listing.stage} />
          {unread && (
            <span className="rounded-full bg-primary-500 px-1.5 py-0.5 text-[11px] font-medium text-primary-foreground">
              {listing.unreadCount}
            </span>
          )}
        </div>
      </div>
      {action && consultation && (
        <Button asChild size="sm" variant={action.variant} className="relative z-20 shrink-0 self-center">
          <Link href={`/consultations/${consultation.id}`}>{action.label}</Link>
        </Button>
      )}
    </Card>
  );
})}
```

Note: the row is no longer wrapped in an outer `<Link>` — `Card` is now the top-level mapped element (`key` moved onto it) and is a plain non-interactive container; the click target is the absolutely-positioned overlay `Link` inside it, per the Global Constraints stretched-link pattern.

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no errors in `app/(app)/conversations/page.tsx`.

Run: `npx eslint app/\(app\)/conversations/page.tsx --max-warnings 0`
Expected: clean.

- [ ] **Step 6: Manual browser check**

Run: `npm run dev`, sign in as an expert with at least one conversation that has no linked consultation and (if seed data allows) one with a `scheduled` or `completed` consultation. Open `/conversations` and confirm:
- Rows without a consultation behave exactly as before (click anywhere opens the thread).
- A row with a `scheduled`/`completed` consultation shows the right preview text and the right button ("Join call" / "View summary").
- Clicking the button navigates to `/consultations/[id]` without also navigating to the thread underneath (i.e., only one navigation happens).
- Clicking anywhere else on that same row still opens the thread.

- [ ] **Step 7: Commit**

```bash
git add "app/(app)/conversations/page.tsx"
git commit -m "Show call status and quick actions inline on conversation rows"
```

---

### Task 3: Remove the "Calls" nav entry

**Files:**
- Modify: `lib/constants/nav.tsx:68-79`

**Interfaces:**
- Consumes: nothing new.
- Produces: `EXPERT_NAV` with 9 items instead of 10 (no more `Calls` entry). No other task depends on this.

- [ ] **Step 1: Remove the `Calls` entry from `EXPERT_NAV`**

Change (`lib/constants/nav.tsx:68-79`):

```tsx
export const EXPERT_NAV: NavItem[] = [
  { label: "Home", href: "/expert/dashboard", icon: Home },
  { label: "Opportunities", href: "/expert/opportunities", icon: Briefcase01 },
  { label: "Projects", href: "/expert/projects", icon: DashboardSquare01 },
  { label: "Calls", href: "/expert/calls", icon: Conversations },
  { label: "Contributions", href: "/expert/contributions", icon: Clipboard },
  { label: "Insights", href: "/expert/insights", icon: Reports },
  { label: "Playbooks", href: "/expert/playbooks", icon: Playbooks },
  { label: "Conversations", href: "/conversations", icon: Conversations },
  { label: "Rewards", href: "/expert/rewards", icon: Award01 },
  { label: "Profile", href: "/expert/profile", icon: UserCircle02 },
];
```

to:

```tsx
export const EXPERT_NAV: NavItem[] = [
  { label: "Home", href: "/expert/dashboard", icon: Home },
  { label: "Opportunities", href: "/expert/opportunities", icon: Briefcase01 },
  { label: "Projects", href: "/expert/projects", icon: DashboardSquare01 },
  { label: "Contributions", href: "/expert/contributions", icon: Clipboard },
  { label: "Insights", href: "/expert/insights", icon: Reports },
  { label: "Playbooks", href: "/expert/playbooks", icon: Playbooks },
  { label: "Conversations", href: "/conversations", icon: Conversations },
  { label: "Rewards", href: "/expert/rewards", icon: Award01 },
  { label: "Profile", href: "/expert/profile", icon: UserCircle02 },
];
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: clean (this file has no consumers that assume a fixed `EXPERT_NAV` length).

Run: `npx eslint lib/constants/nav.tsx --max-warnings 0`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add lib/constants/nav.tsx
git commit -m "Remove the Calls nav entry now that calls live in Conversations"
```

---

### Task 4: Redirect the old `/expert/calls` route

**Files:**
- Modify: `app/(app)/expert/calls/page.tsx`

**Interfaces:**
- Consumes: `redirect` from `next/navigation`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Replace the page with a server-side redirect**

Replace the entire contents of `app/(app)/expert/calls/page.tsx` with:

```tsx
import { redirect } from "next/navigation";

export default function ExpertCallsPage() {
  redirect("/conversations");
}
```

This removes the `"use client"` directive and every import/hook the old implementation used (`useEffect`, `useState`, `consultationsApi`, `projectsApi`, `expertApi`, `useSessionStore`, `ExpertGate`, `Card`, `Button`, `StatusBadge`, `EmptyState`, `Skeleton`, `formatCallWhen`, `formatDuration`) — none of them are needed anymore since the page's only job is to forward.

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: clean.

Run: `npx eslint "app/(app)/expert/calls/page.tsx" --max-warnings 0`
Expected: clean.

- [ ] **Step 3: Manual browser check**

With `npm run dev` running, navigate directly to `http://localhost:3000/expert/calls` and confirm it redirects to `/conversations` rather than rendering the old page or 404ing.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/expert/calls/page.tsx"
git commit -m "Redirect the retired /expert/calls route to /conversations"
```

---

### Task 5: Fix the consultation lobby breadcrumb

**Files:**
- Modify: `app/(app)/consultations/[consultationId]/page.tsx:159-166`

**Interfaces:**
- Consumes: nothing new (the file's existing `isExpert` variable stays defined and is still used elsewhere in the file, e.g. the "Back to project" link).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Make the breadcrumb always point at `/conversations`**

Change (`app/(app)/consultations/[consultationId]/page.tsx:159-166`):

```tsx
<div className="flex items-center gap-1.5 text-xs text-gray-500">
  <Link href={isExpert ? "/expert/calls" : "/conversations"} className="hover:text-gray-300">
    {isExpert ? "Calls" : "Conversations"}
  </Link>
  <ChevronRight className="size-3" aria-hidden />
  <span className="text-gray-300">
    {counterpart ? `${counterpart.firstName} ${counterpart.lastName}` : "Consultation"}
  </span>
</div>
```

to:

```tsx
<div className="flex items-center gap-1.5 text-xs text-gray-500">
  <Link href="/conversations" className="hover:text-gray-300">
    Conversations
  </Link>
  <ChevronRight className="size-3" aria-hidden />
  <span className="text-gray-300">
    {counterpart ? `${counterpart.firstName} ${counterpart.lastName}` : "Consultation"}
  </span>
</div>
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: clean — confirm `isExpert` is still referenced elsewhere in the file (the "Back to project" `Link` further down) so this edit doesn't leave it unused.

Run: `npx eslint "app/(app)/consultations/[consultationId]/page.tsx" --max-warnings 0`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/consultations/[consultationId]/page.tsx"
git commit -m "Point the consultation breadcrumb at the merged Conversations inbox"
```

---

### Task 6: Full verification pass

**Files:** none (verification only; fix-forward in this task if something fails)

**Interfaces:** none.

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: succeeds with no type or lint errors. If `.next/types` errors reference the removed `/expert/calls` implementation, run `rm -rf .next` and rebuild (per this repo's known stale-types gotcha after moving/deleting route files).

- [ ] **Step 2: Full lint**

Run: `npx eslint app components lib hooks --max-warnings 0`
Expected: clean.

- [ ] **Step 3: Manual QA — expert role**

With `npm run dev` running, sign in as an approved expert and, using whatever seed/mock data or manually-created state is available (book a consultation, send a message, etc. through the existing UI if seed data doesn't already cover every case):
- Confirm the sidebar shows "Conversations" and no longer shows "Calls".
- Find or create one thread in each state: no consultation, `scheduled` consultation, `in_call` consultation, `completed` consultation. Confirm each row's preview text, badge, and button match the spec (Join call / Rejoin call / View summary / no button).
- Confirm the `in_call` row sorts above all others regardless of its last message time.
- Click the action button on a call-having row and confirm it navigates to the consultation page without also opening the thread.
- Click a row with no consultation and confirm it opens the thread as before.
- Navigate to `/expert/calls` directly and confirm it redirects to `/conversations`.
- Open a `scheduled` consultation directly at `/consultations/[id]` and confirm the breadcrumb reads "Conversations" and links to `/conversations`.
- If you can get to the empty state (an expert/client with zero conversations), confirm the existing `EmptyState` copy still reads sensibly now that this list also covers calls — no code change expected here per the spec, just a wording sanity check.

- [ ] **Step 4: Manual QA — client role**

Sign in as a client with the equivalent set of counterpart states and confirm the same row behavior and copy (client-facing description text, action buttons, preview fallback).

- [ ] **Step 5: If any check in Steps 3–4 fails, fix the relevant file from Tasks 1–5 and re-run Steps 1–4 before proceeding.**

- [ ] **Step 6: Final commit (only if Step 5 required changes)**

```bash
git add -A
git commit -m "Fix issues found during unified inbox verification pass"
```
