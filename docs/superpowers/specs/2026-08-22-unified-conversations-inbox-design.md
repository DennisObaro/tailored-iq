# Unified conversations inbox (merge Calls into Conversations)

Status: approved for planning
Date: 2026-08-22

## Goal

Today an expert has two separate top-level nav destinations for talking to
clients: **Calls** (`/expert/calls`, a list of `Consultation` records) and
**Conversations** (`/conversations`, a list of `ExpertConversation` threads).
Clients only ever see the latter. The two are visually and structurally
disconnected even though a call and its chat thread are usually the same
underlying relationship.

We're merging them into one inbox, on both roles, so the experience reads
like an ordinary chat app: one list of the people you're talking to, each
row showing whatever's most relevant — a message preview, or a call that's
scheduled, live, or just finished.

## Why this is low-risk

The data model already supports this without new entities:

- `ExpertConversation` (`lib/types/expert-conversation.ts`) is keyed by
  `clientId + expertId + projectId` and carries an optional
  `consultationId`.
- Booking a call (`bookConsultation` in `lib/api/consultations.ts`) already
  calls `getOrCreateConversationWithin` and stamps `consultationId` onto the
  thread in the same write.
- Consultations that predate a thread get backfilled lazily via
  `getConversationForConsultation` (`lib/api/expert-conversations.ts:66`),
  which the consultation lobby page already calls today.

So every consultation an expert or client can see already has (or can
resolve) exactly one `ExpertConversation` thread. There is no case where a
call exists with no addressable thread. That means "merge Calls into
Conversations" is a UI/DTO change, not a data migration.

Out of scope: grouping by counterparty across multiple projects. The
existing `clientId+expertId+projectId` identity stays as-is — a client and
expert working two separate challenges still get two separate rows. That's
a bigger change to conversation identity and isn't part of this spec.

## Data & API changes

**`lib/api/expert-conversations.ts` — extend `ConversationListing`.**

Today it exposes only the derived `stage` (`active` |
`consultation_scheduled` | `consultation_completed` | `archived`), which
loses information the row needs (is the call literally in progress right
now vs. merely scheduled? when is it scheduled for?). Add the raw
consultation fields the row needs to decide what to render:

```ts
export interface ConversationListing {
  conversation: ExpertConversation;
  counterpart: User;
  counterpartProfile?: ExpertProfile;
  projectTitle: string;
  stage: ExpertConversationStage;
  lastMessage?: ConversationMessage;
  unreadCount: number;
  // New:
  consultation?: Pick<Consultation, "id" | "status" | "scheduledFor">;
}
```

`listConversationsForUser` already loads the consultation internally via
`stageFor()` — change `stageFor` (or add a sibling lookup alongside it) to
also return the consultation record itself, and thread it into the mapped
`ConversationListing`. No new database reads are introduced; this is
exposing data the function already touches.

`stageFor`'s status mapping is unchanged. No new `ExpertConversationStage`
value is needed — the row derives "is it live" from
`consultation.status === "in_call"` directly rather than from `stage`.

**Sorting.** `listConversationsForUser` keeps its existing recency sort
(`lastMessage?.createdAt ?? conversation.updatedAt`, descending) as the
base order. On top of that, apply one exception: any listing whose
`consultation.status === "in_call"` sorts to the very top, above
everything else, regardless of recency. Scheduled-but-not-started and
completed calls do **not** get special sort treatment — they sort by
recency like any other thread. This keeps the list feeling like a normal
recency-ordered chat inbox, while still surfacing the one state that's
genuinely time-critical (a call happening right now).

## UI changes — `app/(app)/conversations/page.tsx`

This page already serves both roles (`isExpertView` is derived from
whether the viewer appears as `expertId` on any listing) and already has
the row skeleton this design reuses: `Avatar`, name, relative timestamp,
project title, message preview, `StatusBadge`, unread pill, wrapped in a
`Link` to the thread.

Changes to the row:

1. **Preview text fallback.** Currently: `lastMessage ? ... : "No messages
   yet."`. When there's no message yet but the row has a
   `consultation` that isn't cancelled, show a call-specific fallback
   instead:
   - `scheduled` → `` `Call scheduled for ${formatCallWhen(consultation.scheduledFor)}` `` (reuse `formatCallWhen` from `lib/utils/format.ts`, already used on the old Calls page).
   - `in_call` → `"Call in progress"`.
   - `completed` → `"Call completed"`.
   - Otherwise (no consultation, or cancelled) → keep `"No messages yet."`.

2. **Row action button.** Add a right-aligned action, mirroring what the
   old `CallRow` did, shown only when `consultation` is present:
   - `status === "scheduled"` or `"in_call"` → primary `Button` labeled
     "Join call" (`in_call` can say "Rejoin call" if it reads better in
     context — implementer's call), linking to
     `/consultations/${consultation.id}` (that page itself decides
     whether to show the join screen or jump straight into
     `/consultations/[id]/call`; don't bypass it).
   - `status === "completed"` → secondary/outline `Button`, smaller,
     labeled "View summary", same link target.
   - `status === "cancelled"` or no consultation → no button; row stays
     click-through-to-thread only, exactly as today.
   - The button lives inside the row but is a separate `Link`/click target
     from the row's own `Link` wrapper — don't nest an `<a>` inside an
     `<a>`. (The old `expert/calls` page didn't have this problem because
     the whole row wasn't a link; this page's row *is* a link, so the
     action button needs `onClick`/`stopPropagation` or an equivalent
     restructure — e.g. render the button via a sibling `Link` positioned
     absolutely, or convert the row's outer wrapper from `<Link>` to a
     `<div>` with the row body as the primary click target and the button
     as an explicit secondary `Link`.)

3. **Live call visual treatment.** A row whose `consultation.status ===
   "in_call"` gets a subtle highlight (e.g. the same
   `border-primary-500/30` treatment unread rows already get, or a small
   "Live" indicator next to the timestamp) in addition to sorting to the
   top. Keep it subtle — this is a nice-to-have, not a new visual
   language.

4. **Copy.** Update the page description to acknowledge calls live here
   too, e.g. expert: *"Clients you're working with — messages and
   scheduled calls, in one place."* Client-side copy can stay close to
   what it says today since clients already see call status inline via
   `stage`.

5. **Empty state.** Keep the existing `EmptyState` (icon, title,
   description, and the "Explore experts" action for clients) — its
   copy already doesn't claim "no calls," so no functional change needed,
   just confirm wording still makes sense now that this is the only inbox.

No change needed to `StatusBadge`/`STATUS_LABELS` — `scheduled`,
`in_call`, `completed`, `consultation_scheduled`, `consultation_completed`
are all already defined.

## Access control

The old `/expert/calls` page wrapped its entire body in `<ExpertGate
profile={profile} requires="calls">`, gating all call visibility on
`canJoinCalls` from `getExpertAccess`. `/conversations` has never been
gated this way — and doesn't need to be: `getOrCreateConversation` already
refuses to create a thread for an expert whose `verificationStatus !==
"approved"`, so in practice only approved experts (who always have
`canJoinCalls: true`) end up with any consultation-linked thread. No new
gating logic is needed on the merged page; this isn't a regression from
today's `/expert/calls` gate, it's removing a redundant check.

## Nav changes — `lib/constants/nav.tsx`

Remove the `Calls` entry from `EXPERT_NAV`:

```diff
 export const EXPERT_NAV: NavItem[] = [
   { label: "Home", href: "/expert/dashboard", icon: Home },
   { label: "Opportunities", href: "/expert/opportunities", icon: Briefcase01 },
   { label: "Projects", href: "/expert/projects", icon: DashboardSquare01 },
-  { label: "Calls", href: "/expert/calls", icon: Conversations },
   { label: "Contributions", href: "/expert/contributions", icon: Clipboard },
   { label: "Insights", href: "/expert/insights", icon: Reports },
   { label: "Playbooks", href: "/expert/playbooks", icon: Playbooks },
   { label: "Conversations", href: "/conversations", icon: Conversations },
   { label: "Rewards", href: "/expert/rewards", icon: Award01 },
   { label: "Profile", href: "/expert/profile", icon: UserCircle02 },
 ];
```

`CLIENT_NAV` is unchanged — it already only has one "Conversations" entry.

## Route changes

- `app/(app)/expert/calls/page.tsx`: replace the current implementation
  with a redirect to `/conversations` (use Next's `redirect()` from
  `next/navigation` in a server component, or a client-side
  `router.replace` — match whatever pattern
  `app/(app)/consultations/[consultationId]/page.tsx` already uses for its
  scheduled→thread redirect, for consistency). This isn't just cleanliness
  — nothing else in the app links to `/expert/calls` after this change, but
  a stale bookmark or notification shouldn't 404.
- `app/(app)/consultations/[consultationId]/page.tsx` breadcrumb
  (`page.tsx:159-166`): currently reads `isExpert ? "Calls" : "Conversations"`
  linking to `/expert/calls` or `/conversations`. Change to always show
  `"Conversations"` linking to `/conversations` for both roles, since
  `/expert/calls` no longer exists as a real destination.

## Testing plan

No test suite exists in this repo — verification is `tsc --noEmit` +
`eslint --max-warnings 0` + `npm run build`, plus manual verification in
the browser. Manual checklist:

- As an approved expert with at least one thread that has no linked
  consultation, one with a `scheduled` consultation, one `in_call`, and one
  `completed`: confirm each row shows the right preview text, badge, and
  action button (or none).
- Confirm the `in_call` row sorts to the top regardless of its last
  message time, and the others sort by recency as before.
- Click "Join call" / "Rejoin call" / "View summary" from the list and
  confirm it lands on the right screen without also opening the thread
  underneath (the nested-link concern above).
- Click a row with no consultation and confirm it opens the thread as
  before.
- As a client with the equivalent set of counterpart states, confirm the
  same row behavior (client-side copy, same action buttons).
- Navigate to `/expert/calls` directly and confirm it redirects to
  `/conversations` rather than 404ing.
- Open a `scheduled` consultation's lobby page directly
  (`/consultations/[id]`) as both roles and confirm the breadcrumb reads
  "Conversations" and links correctly.
- Confirm the expert sidebar no longer shows "Calls," and the remaining
  "Conversations" entry is the sole nav path for both roles.

## File-by-file touch list

- `lib/api/expert-conversations.ts` — extend `ConversationListing`, update
  `stageFor`/`listConversationsForUser` to surface consultation
  id/status/scheduledFor, add the `in_call`-first sort rule.
- `app/(app)/conversations/page.tsx` — row preview fallback, action
  button, live-call highlight, copy tweaks.
- `lib/constants/nav.tsx` — remove the `Calls` entry from `EXPERT_NAV`.
- `app/(app)/expert/calls/page.tsx` — replace with a redirect to
  `/conversations`.
- `app/(app)/consultations/[consultationId]/page.tsx` — breadcrumb label
  and link, unconditional "Conversations" / `/conversations`.
