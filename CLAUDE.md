# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev              # start dev server (localhost:3000)
npm run build             # production build — the main correctness check, since there's no test suite
npm run start              # serve a production build
npx eslint app components lib hooks --max-warnings 0    # lint (npm run lint runs eslint with no args)
npx tsc --noEmit                                        # typecheck (no dedicated script)
```

There is no test suite in this repo (no test runner is configured, no `*.test.*`/`*.spec.*` files). Verification is `tsc --noEmit` + `eslint --max-warnings 0` + `npm run build`, plus manually driving the app in a browser for anything UI-facing.

After deleting or moving a route file, stale entries in `.next/types` can make `tsc` fail with errors unrelated to your change (e.g. `Cannot find module '.../page.js'`) — `rm -rf .next` and restart the dev server to regenerate them before re-checking.

## Architecture

**This is a frontend-only prototype with a fake backend.** There is no server/database — everything is simulated client-side and persisted to `localStorage`.

### Service-layer boundary

Pages and components only ever import from `lib/api/*`. `lib/mock-data/*` (seed fixtures) and `lib/ai-sim/*` (fake content generation) are implementation details of that layer and must never be imported directly from `app/` or `components/`. This boundary is the point of the architecture: a real backend developer would delete `lib/api/_db.ts`, `lib/mock-data/*`, and `lib/ai-sim/*` and reimplement each `lib/api/*.ts` function against real endpoints, without touching any calling code.

### The mock database

`lib/api/_db.ts` holds an in-memory `Database` object (seeded from `lib/mock-data/fixtures/seed.ts` on first load) that's mirrored to `localStorage` under the key `tiq_db_v6` (bump this key whenever the `Database` shape changes — a stale blob deserializes into a database missing the new tables). It's only ever touched through:
- `db.get()` — returns a deep clone (never a live reference, so mutating the result can't leak into the store)
- `db.update(mutator)` — runs a mutator against the real cache, persists, returns a clone of the result
- `db.reset()` — reseeds from fixtures (exposed in-app at `/settings/data` as "Reset demo data")

Every `lib/api/*.ts` function wraps its body in `simulateNetwork()` or `simulateGeneration()` (`lib/api/client.ts`) to fake latency — plain reads/writes take ~150–650ms, "AI generation" style calls (report/playbook/brief generation, expert matching) take ~1.4–2.6s. Account for this when writing any Playwright/browser verification: a short fixed `waitForTimeout` after a generation-triggering action will frequently fire before the state has actually updated — poll for the expected text/state instead of a single fixed-point check.

### Diagnosis → brief → report → expert → playbook pipeline

`Project.status` is a state machine that drives most of the app: chat diagnosis (fixed question script in `lib/ai-sim/chat-responder.ts`) → confirmed `Brief` → generated `Report` → matched `Experts` → optional `Consultation` → generated `Playbook`. All content generation for these is faked by `lib/ai-sim/*` (`categorizer`, `report-generator`, `playbook-generator`, `transcript-generator`, `expert-matcher`) reading off the Brief/Report/Consultation data — there is no real LLM call anywhere in this codebase.

The brief-review UI, and everything that happens after confirming it (report ready, expert matches, "get a playbook"), lives inline in the `/chat/[projectId]` thread rather than as separate pages — that page effectively re-implements the same auto-advancing orchestration `/projects/[projectId]` also has, so changes to one lifecycle stage usually need to be checked against both.

### Playbook catalog ("Explore")

Separate from per-project generated playbooks (`Playbook.projectId` is optional — set for project-generated ones, absent for catalog-unlocked ones), there's a static catalog of pre-written playbook templates: `lib/mock-data/fixtures/playbook-catalog.fixture.ts` splits `PLAYBOOK_TEMPLATES` (public marketing metadata: title/description/category/price) from `PLAYBOOK_TEMPLATE_CONTENT` (the real content), so a locked card can never leak content through its own data. Unlocking (`lib/api/playbook-catalog.ts`) is a mock purchase — no real payment integration — that stamps the template's content into a real `Playbook` record, after which it renders through the exact same `/playbooks/[playbookId]` detail page as a project-generated one.

### The expert side

The expert experience is gated, not open. `lib/api/expert-referrals.ts` owns the invitation codes; an `ExpertProfile` can only be created by `startExpertOnboarding` (`lib/api/expert-onboarding.ts`), which refuses to run without a referral claimed against that user. That's what makes `/become-an-expert` a real gate rather than a screen — navigating straight to `/expert/onboarding` finds no profile and bounces back to it. There is deliberately no generic `upsertExpertProfile`; every mutation goes through a named step function that enforces its own rule (evidence before verification, evidence-backed expertise, a passed quiz before submission).

What an expert may *do* comes from one place: `getExpertAccess(profile)` in `lib/utils/expert-access.ts`, rendered by `components/expert/expert-gate.tsx`. Pages ask for a capability (`requires="accept"`), never for a status, so adding a verification status can't accidentally grant access somewhere. What an expert may *see* is enforced in the API: `canViewProject` (`lib/api/_access.ts`) backs the optional `viewerId` argument on `getProject`/`getBrief`/`getReport`/`getPlaybook`/`getConsultation` — pass it whenever the result will be rendered, and an unauthorised read comes back `null` so the page shows its ordinary not-found state.

Contribution flow splits on type (`isKnowledgeContribution`, `lib/api/contributions.ts`): project work (playbook input, recommendation review) goes straight to the client and is credited immediately; knowledge-base work (insights, case studies, thought leadership) enters peer review and only publishes once another expert approves it. Points are written to `expertPointsTransactions` through `awardPointsWithin`, which re-derives `profile.points` and `profile.expertLevel` from the ledger — the same invariant `reconcileStanding` maintains in `seed.ts`, so a profile can never disagree with its own history. Point values and level thresholds are configuration in `lib/constants/expert.ts`, as are the help areas, contribution preferences, policies and quiz questions.

Approval is a real state transition, exercised through the reviewer queue at `/settings/expert-review` (an internal admin surface in a real deployment). Approving also activates the referral that introduced the expert and credits the referrer.

### Route groups

- `app/(app)/*` — the authenticated shell with the sidebar (`components/layout/sidebar.tsx`). Nav items differ by role via `getNavItems(role)` in `lib/constants/nav.tsx` (client: Home/Ask TailoredIQ/Reports/Playbooks/Experts/Conversations; expert: Home/Opportunities/Projects/Calls/Contributions/Insights/Rewards/Profile). Roles are additive on one account — never create a second account for a dual-role user.
- `app/become-an-expert/*` — the public referral gate, outside `(auth)` for the same split-panel reason as sign-up. It hands a verified code to `/sign-up?referral=…` (new user) or claims it directly (already signed in).
- `app/(auth)/*` — sign-in only. Sign-up (`app/sign-up/page.tsx`) deliberately lives outside this group at the top level, because it needs a full-viewport split-panel layout (testimonial carousel + dot-grid background, `components/auth/*`) that's incompatible with `(auth)`'s centered-card layout used by sign-in.
- `app/onboarding/*` — single-step post-signup flow, sharing the same split-panel shell as sign-up.

### Styling

Tailwind v4, no `tailwind.config.ts` — all tokens (`gray-50…975`, `primary-50…950`, `danger`/`success`) are CSS custom properties in `app/globals.css` under `:root`, re-exposed via `@theme inline`. Because of CSS cascade layers, an unlayered rule beats *any* layered Tailwind utility regardless of specificity — global base-level overrides (e.g. the `:focus-visible` outline, the `:-webkit-autofill` fix) must be wrapped in `@layer base { … }` or Tailwind utilities will silently win over them.

Shared components live in `components/ui/*` (Button, Card, Input/Textarea/Select/Label/FieldError, Badge, StatusBadge, Avatar, Checkbox, Skeleton, EmptyState, ErrorState, DropdownMenu, Tooltip) — extend these via `className` (merged through `cn()`, `lib/utils/cn.ts` = `clsx` + `tailwind-merge`) rather than writing one-off markup. `StatusBadge`'s `STATUS_LABELS` map needs a new entry whenever a new status string is introduced anywhere in the app, or it silently falls back to the raw string.
