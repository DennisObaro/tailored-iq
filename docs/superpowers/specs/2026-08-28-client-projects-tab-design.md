# Client "Projects" tab (implementation engagements)

Status: approved for planning
Date: 2026-08-28

## Goal

Today, once a client has a finished `Playbook`, the only next step the app
offers is a one-shot expert match (`RelevantExpertsPanel` variant
`"implementation"` on the playbook page, already shipped) that leads either
to a message or a single consultation booking. There's no tracked
relationship after that — no record of "this expert is actively helping me
implement this," no shared space for the calls/files/schedule that come out
of it, and no way to close the loop with a rating.

We're adding that tracked relationship: a new `Engagement` entity, a client
nav tab called **Projects** that lists a client's engagements in three
buckets (In Progress / Completed / Rating), and a workspace page per
engagement housing its chat, schedule log, and files.

This is deliberately **not** the same thing as the existing `Project` type
(`lib/types/project.ts`), which is the diagnosis→brief→report→playbook
pipeline and is already shown to clients under the nav label "Challenges" at
`/projects`. `Engagement` is a new, smaller type; "Projects" (the new tab's
label) and "Challenges" (the existing tab's label) intentionally read as two
different things even though the underlying `Project` type's name doesn't
change. See "Naming" below for why this is safe.

## Naming

| What | Existing | New |
|---|---|---|
| Diagnostic pipeline type | `Project` (`lib/types/project.ts`) | unchanged |
| Diagnostic pipeline client nav | "Challenges" → `/projects` | unchanged |
| Diagnostic pipeline expert nav | "Projects" → `/expert/projects` | unchanged |
| Implementation tracking type | — | `Engagement` (`lib/types/engagement.ts`) |
| Implementation tracking client nav | — | **"Projects"** → `/engagements` |
| Implementation tracking expert view | — | new section inside `/expert/projects/[projectId]` |

No route or type is renamed. The only place two things share the word
"Projects" is the client nav ("Projects" → new) vs. the expert nav
("Projects" → existing) — different roles never see both labels at once, so
this doesn't read as a collision in the UI, only in a side-by-side table
like this one.

## Data model

**`lib/types/engagement.ts`** (new file):

```ts
export type EngagementStatus = "in_progress" | "pending_completion" | "completed";

export interface Engagement {
  id: string;
  clientId: string;
  expertId: string;
  playbookId: string;
  /** The diagnostic project this playbook came from. Always present — see "Scope: catalog playbooks" below. */
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

"Rating" is not a stored status — it's derived per-viewer, the same pattern
`ExpertConversationStage` already uses to derive thread state from a linked
consultation rather than storing it redundantly. A `completed` engagement
where the *viewer* has not yet submitted their `EngagementReview` belongs in
the Rating bucket; once they submit, it moves to Completed for them,
independent of whether the other party has rated yet. This means the same
engagement can sit in different buckets for the client and the expert at the
same time, which is correct — each side's "have I closed this out" state is
their own.

**`lib/types/consultation.ts`** — extend `Consultation`:

```diff
 export type ConsultationStatus = "scheduled" | "in_call" | "completed" | "cancelled";
+export type ConsultationMode = "virtual" | "on_site";

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
   ...
```

Existing consultations get `mode: "virtual"` on read (seed fixtures updated,
plus a defensive fallback in `getConsultation`/list functions isn't needed
since this is a full-object field, not partial — just backfill the fixture
data). `engagementId` absent means "the original diagnostic call," exactly
like today.

**`lib/types/expert-conversation.ts`** — extend `ExpertConversation`:

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
   ...
```

One more optional pointer, same shape as the two that already exist. No
change to `ExpertConversationStage` or its derivation — out of scope for
this spec, the workspace page reads the engagement's own status directly
rather than through the thread's derived stage.

**`lib/api/_db.ts`** — add `engagements: Engagement[]` and
`engagementReviews: EngagementReview[]` to `Database`, seed both as `[]`,
and **bump the storage key** (currently `tiq_db_v11`, becomes `tiq_db_v12`)
per the existing rule (a stale blob has no `engagements` array).

## Scope: catalog playbooks

`Playbook.projectId` is optional — absent for catalog-unlocked playbooks,
present for project-generated ones. `Engagement.projectId` is **not**
optional: booking implementation support requires the playbook to have a
`projectId`, because the engagement reuses the existing
`ExpertConversation`/`canViewProject` machinery, which is keyed on
`projectId`.

For catalog playbooks (no `projectId`), the tracked-Engagement flow (booking
→ Projects tab → workspace) is **out of scope for this iteration**. The
existing "Talk to an expert" path on the implementation panel keeps working
unchanged (`ExpertCard`'s "Talk to X" already degrades gracefully when there's
no `projectId` — it opens the expert's profile instead of a direct thread).
This is a deliberate simplification, not an oversight — minting a throwaway
`Project` just to anchor an engagement would leak a meaningless entry into
the client's "Challenges" list. If catalog-playbook implementation tracking
turns out to matter, that's a follow-up spec.

## Trigger & booking flow

`RelevantExpertsPanel` / `ExpertCard` (`components/expert/relevant-experts-panel.tsx`,
`components/expert/expert-card.tsx`) get a new optional `playbookId` prop,
threaded the same way `projectId` already is. The playbook page
(`app/(app)/playbooks/[playbookId]/page.tsx:100-109`, the `expertsPanel`
object) passes `playbookId: playbook.id` alongside the existing
`projectId: playbook.projectId`.

`ExpertCard`'s href (`components/expert/expert-card.tsx:45-49`) gains
`playbookId` in the query string when present, same pattern as `projectId`/`reason`.
The expert profile page (`app/(app)/experts/[expertId]/page.tsx:31,98`) reads
it and appends it to `bookHref`.

**`app/(app)/experts/[expertId]/book/page.tsx`** gains an implementation
mode, entered when `?playbookId=` is present in the URL:

- The "Which challenge is this for?" `Select` (today's `projectId` picker,
  lines 142-154) is **hidden** — the playbook already fixes the context, and
  reusing that selector's `!p.consultationId` eligibility filter would be
  wrong here (the diagnostic project already has a consultation; that's not
  disqualifying for implementation work).
- A new toggle appears: **Virtual call** / **On-site session** (maps to
  `ConsultationMode`).
- "Confirm consultation" becomes "Confirm session" and calls a new function,
  `consultationsApi.bookImplementationConsultation`, instead of
  `bookConsultation`.
- On success, redirect to `/engagements/${engagementId}` instead of
  `/conversations/${conversationId}` — the workspace is the useful next
  screen once an engagement exists, the way the thread is for a fresh
  diagnostic booking.

**`lib/api/consultations.ts`** — new function, alongside the existing
`bookConsultation` (not a modification of it — see why below):

```ts
export async function bookImplementationConsultation(input: {
  playbookId: string;
  clientId: string;
  expertId: string;
  scheduledFor: string;
  mode: ConsultationMode;
}): Promise<{ consultation: Consultation; engagementId: string; conversationId: string }>
```

Why a separate function rather than extending `bookConsultation`:
`bookConsultation` writes `project.consultationId = consultation.id` and
`project.status = "consultation_scheduled"` unconditionally (lines 214-217) —
correct for the diagnostic flow, where a project only ever gets one
consultation (the booking page's `!p.consultationId` filter enforces this).
An implementation booking must **never** touch `project.status` or
`project.consultationId` — the project is typically already
`playbook_ready`/`completed`, and an engagement can have many consultations
over time (repeat calls), which would otherwise repeatedly stomp on a field
meant to hold one value. Keeping this as a separate function means the
existing, heavily-commented diagnostic booking path is untouched and
un-risked.

Behavior, sharing the existing private slot-validation helpers
(`bookedTimesWithin`, `expandAvailability`) already in this file:

1. Validate the slot exactly like `bookConsultation` does (same offered/taken checks).
2. Look up the playbook; if `playbook.projectId` is missing, throw
   (`"This playbook isn't linked to a challenge yet."`) — the catalog-playbook
   case from "Scope" above.
3. Look up the project; ensure `expertId` is in `project.matchedExpertIds`
   (same reasoning as the diagnostic path — the expert needs read access to
   the brief/report for context) but do **not** touch `project.status` or
   `project.consultationId`.
4. `getOrCreateEngagementWithin(d, { clientId, expertId, playbookId, projectId })`
   from the new `lib/api/engagements.ts` — creates with `status: "in_progress"`
   if this is the first booking for this (client, expert, playbook) triple,
   otherwise reuses it. This is what makes multiple concurrent engagements on
   one playbook possible (different experts → different engagements) while
   repeat bookings with the *same* expert accumulate onto one engagement.
5. Create the `Consultation` with `mode`, `engagementId: engagement.id`,
   `status: "scheduled"` (both modes start here — an on-site session is
   "scheduled" until logged complete, same as a virtual call is "scheduled"
   until it happens).
6. `getOrCreateConversationWithin(d, { clientId, expertId, projectId })` —
   reuses whatever thread already exists with this expert on this project
   (e.g., from the original diagnostic consultation), or creates one. Stamp
   `conversation.consultationId`, `conversation.playbookId`,
   `conversation.engagementId` onto it and post a system message ("Session
   scheduled — …"), mirroring `bookConsultation`'s existing pattern
   (lines 224-235). Note `conversation.consultationId` will point at
   whichever consultation was booked most recently if there are repeat
   bookings — same simplification the diagnostic flow already has, just
   newly exercised here since diagnostic projects never got a second
   booking. The full history lives on the engagement's schedule log, not the
   thread pointer.
7. Notifications to both parties, `linkHref: /engagements/${engagement.id}`.

**On-site completion.** New `completeOnSiteSession(consultationId)` in the
same file: sets `status: "completed"` directly (no transcript — there's no
call audio to fake), callable by either party from the engagement workspace.
Virtual calls keep using the existing `startCall`/`endCall` pair unchanged.

**`endCall`** (existing function, `lib/api/consultations.ts:297-335`) —
one conditional added: the `project.status = "consultation_completed"` /
`project.activity.push(...)` block (lines 318-320) only runs when
`!consultation.engagementId`. Transcript generation, duration, and the
expert's point award stay unconditional — those are still meaningful for an
implementation call.

## Completion & rating

**`lib/api/engagements.ts`** (new file):

- `getOrCreateEngagementWithin(d, { clientId, expertId, playbookId, projectId })`
  — described above.
- `getEngagement(id, viewerId)` — access-gated via a new `canViewEngagement`
  in `lib/api/_access.ts` (same two-participant shape as
  `canViewExpertConversation`).
- `listEngagementsForClient(clientId)` / `listEngagementsForExpert(expertId)`
  — return an `EngagementListing` (engagement + counterpart `User` +
  playbook title + the viewer's own `EngagementReview` if any + the other
  party's, if any) so the list page and bucket logic don't need extra
  round-trips.
- `proposeCompletion(engagementId, byRole: "client" | "expert")` — only
  valid from `in_progress`; sets `status: "pending_completion"`,
  `completionProposedBy`, `completionProposedAt`.
- `confirmCompletion(engagementId, byRole)` — only valid from
  `pending_completion` **and** only by the party that did *not* propose it
  (a proposer confirming their own proposal is a no-op guarded against, same
  spirit as other single-writer invariants in this codebase); sets
  `status: "completed"`.
- `retractCompletionProposal(engagementId)` — either party, from
  `pending_completion` back to `in_progress`. Covers "actually, one more
  thing" without a reject/re-propose dance.
- `submitEngagementReview({ engagementId, fromUserId, fromRole, toUserId, rating, comment })`
  — only valid once `status === "completed"`; one review per
  `(engagementId, fromUserId)` pair (upsert, so resubmitting edits rather
  than duplicating — matches `submitReview`'s spirit even though that one
  doesn't need the upsert case today since a consultation only ever gets one
  review).
- `listAttachmentsForEngagement(engagementId)` — reads the engagement's
  `conversationId`, filters its messages for non-empty `attachments`,
  flattens. No new storage — same `MessageAttachment` records the thread
  already carries.

## Workspace UI — `/engagements/[engagementId]`

New page, shared by both roles, access-gated by `canViewEngagement`. Layout:

- **Header**: counterpart avatar/name, linked playbook title (→
  `/playbooks/[playbookId]`), `StatusBadge status={engagement.status}` (both
  `in_progress` and `completed` already have entries in `STATUS_LABELS`;
  `pending_completion` is a new one — see below), and the completion action
  appropriate to `status`/viewer role:
  - `in_progress` → "Mark as complete" button (calls `proposeCompletion`).
  - `pending_completion`, viewer is the proposer → "Waiting for
    {counterpart} to confirm" (read-only) + "Retract" link.
  - `pending_completion`, viewer is not the proposer → "Confirm completion"
    button + "Not yet — keep going" link (calls `retractCompletionProposal`).
  - `completed` → no action here; rating happens in its own section below.
- **Chat**: embeds the existing conversation-thread UI at
  `engagement.conversationId`, reusing whatever component
  `app/(app)/conversations/[conversationId]/page.tsx` already renders rather
  than forking it. The composer there gets a real (metadata-only) file-upload
  control — today `sendMessage` already accepts an `attachments` param and
  the thread already renders attachment chips
  (`app/(app)/conversations/[conversationId]/page.tsx:257-267`), but nothing
  lets a user actually pick a file; this spec adds that input. Since it's
  the same shared component, this benefits every thread, not just engagement
  workspaces — that's fine, it's a strict improvement, not scope creep, given
  the render path already assumes attachments exist.
- **Schedule log**: list of `Consultation`s where `engagementId` matches,
  sorted by `scheduledFor`, each row showing mode (virtual/on-site badge),
  date, status, and — for a `scheduled` on-site row — a "Mark session
  complete" button (`completeOnSiteSession`); for a `scheduled` virtual row,
  the existing join-call affordance the conversations list already has.
- **Files**: flat list from `listAttachmentsForEngagement`, name/size/who
  uploaded/when — a read-only aggregate view, no separate upload control
  here (upload happens through the chat composer).
- **Rating** (only rendered when `status === "completed"`): if the viewer
  hasn't submitted their `EngagementReview`, a form (star rating + optional
  comment) calling `submitEngagementReview`; once submitted, show it as
  read-only, and show the counterpart's review too if it exists.

## List page — `/engagements`

Client-only route for now (the expert side is the section described below,
not a standalone list page — see "Expert-side view"). Cards grouped into
three columns/filters: **In Progress** (`status` is `in_progress` or
`pending_completion`), **Completed** (`status === "completed"` and the
viewer has reviewed), **Rating** (`status === "completed"` and the viewer
has not reviewed). Each card: expert avatar/name, playbook title, a small
badge for `pending_completion` ("Completion proposed"), last-activity
timestamp, links to the workspace.

## Expert-side view

No new expert nav item — the existing "Projects" tab keeps meaning the
diagnostic `Project`. `app/(app)/expert/projects/[projectId]/page.tsx` gets
a new "Engagements" section (near the existing consultation/contributions
cards) listing engagements tied to that project's playbooks, each linking
into the same `/engagements/[engagementId]` workspace page. An expert with
engagements across multiple projects sees them distributed across each
project's page rather than in one global list — consistent with how the
rest of that page is already scoped to a single project, and avoids adding
a second top-level surface for a role whose nav is already dense.

## Access control

**`lib/api/_access.ts`** — add:

```ts
export function canViewEngagement(d: Database, engagementId: string, viewerId: string): boolean {
  const engagement = d.engagements.find((e) => e.id === engagementId);
  if (!engagement) return false;
  return engagement.clientId === viewerId || engagement.expertId === viewerId;
}
```

Same two-participant shape as `canViewExpertConversation` — deliberately not
routed through `canViewProject`'s broader matched-experts logic, since an
engagement is a private relationship between exactly one client and one
expert, same reasoning that function's own docstring already gives for
conversations.

## Nav changes — `lib/constants/nav.tsx`

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

`Briefcase01` is already imported in this file (used by `EXPERT_NAV`'s
"Opportunities") — reused here rather than adding a new icon import, and
there's no visual collision since a client never sees `EXPERT_NAV`.
`EXPERT_NAV` is unchanged (see "Expert-side view" above).

## Status badges — `components/ui/status-badge.tsx`

`in_progress` and `completed` already exist in `STATUS_LABELS` (lines 41-42,
29) with the right sense — reused as-is for `EngagementStatus`. One new
entry:

```diff
+  pending_completion: { label: "Pending completion", tone: "warning" },
```

The Rating bucket is never rendered through `StatusBadge` — it's a plain
labeled `Badge` on the list card, not a stored status, so it can't collide
with anything in this shared map.

## Testing plan

No test suite in this repo — verification is `tsc --noEmit` +
`eslint --max-warnings 0` + `npm run build`, plus manual verification.
Manual checklist:

- From a project-generated playbook's implementation panel, book a virtual
  session with an expert who hasn't been talked to before: confirm an
  `Engagement` and `Consultation` are created, the diagnostic `Project`'s
  `status`/`consultationId` are unchanged, and you land on
  `/engagements/[id]`.
- Book a second session with the *same* expert on the same playbook: confirm
  it reuses the existing engagement (same id) rather than creating a second
  one, and both consultations show in the schedule log.
- Book a session with a *different* expert on the same playbook: confirm a
  second, independent `Engagement` exists and both show separately on
  `/engagements`.
- Run a virtual session through the existing call flow (`startCall`/`endCall`):
  confirm the diagnostic project's status is untouched, and the transcript
  still generates.
- Book and complete an on-site session: confirm no transcript is generated
  and the session shows completed on the schedule log.
- Propose completion as the client, confirm as the expert (and the reverse):
  confirm `pending_completion` → `completed`, and that the *proposer*
  attempting to confirm their own proposal is rejected.
- Retract a completion proposal: confirm it returns to `in_progress`.
- After completion, submit a rating as the client only: confirm the
  engagement shows in the client's Rating bucket before submitting and
  Completed after, while it still shows in the expert's Rating bucket (they
  haven't rated yet).
- Upload a file from the workspace chat composer: confirm it appears in the
  chat as an attachment chip and in the workspace's Files list.
- Attempt to open `/engagements/[id]` as a third user: confirm it 404s /
  shows the not-found state via `canViewEngagement`.
- Confirm the "Projects" tab appears in the client sidebar (not the expert
  one), and the expert sees an "Engagements" section on the relevant
  `/expert/projects/[projectId]` page instead.
- Confirm a fresh `localStorage` (no `tiq_db_v7` key) reseeds cleanly with
  empty `engagements`/`engagementReviews`.

## File-by-file touch list

New:
- `lib/types/engagement.ts` — `Engagement`, `EngagementStatus`, `EngagementReview`.
- `lib/api/engagements.ts` — CRUD, completion/rating flow, attachment aggregation, access-gated getters.
- `app/(app)/engagements/page.tsx` — client list, three buckets.
- `app/(app)/engagements/[engagementId]/page.tsx` — workspace (chat/schedule/files/rating).
- Supporting components under `components/engagement/` (card, status/completion actions, review form, schedule log row, files list) — exact split left to the implementation plan.

Modified:
- `lib/types/index.ts` — export the new engagement types (match existing barrel pattern).
- `lib/types/consultation.ts` — `ConsultationMode`, `Consultation.mode`, `Consultation.engagementId`.
- `lib/types/expert-conversation.ts` — `ExpertConversation.engagementId`.
- `lib/api/_db.ts` — `engagements`/`engagementReviews` arrays, storage key bump `tiq_db_v6` → `tiq_db_v7`.
- `lib/api/_access.ts` — `canViewEngagement`.
- `lib/api/consultations.ts` — `bookImplementationConsultation`, `completeOnSiteSession`, conditional in `endCall`.
- `lib/mock-data/fixtures/seed.ts` — backfill `mode: "virtual"` on existing consultations, seed empty engagement arrays.
- `components/expert/relevant-experts-panel.tsx`, `components/expert/expert-card.tsx` — thread `playbookId` prop.
- `app/(app)/playbooks/[playbookId]/page.tsx` — pass `playbookId` into `expertsPanel`.
- `app/(app)/experts/[expertId]/page.tsx` — read `playbookId` param, include in `bookHref`.
- `app/(app)/experts/[expertId]/book/page.tsx` — implementation-mode branch (hide challenge select, mode toggle, `bookImplementationConsultation`, redirect to workspace).
- `lib/constants/nav.tsx` — add "Projects" to `CLIENT_NAV`.
- `components/ui/status-badge.tsx` — `pending_completion` entry.
- `app/(app)/expert/projects/[projectId]/page.tsx` — new "Engagements" section.
- `app/(app)/conversations/[conversationId]/page.tsx` — file-upload control on the composer (benefits all threads, not engagement-specific).
