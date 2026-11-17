# Decisions

Newest first. Each entry: decision, why, consequence.

## D-014 — Android and Windows packaging deferred to Phase 4

`apps/android` and `apps/desktop` are reserved but not scaffolded in this pass. The request
was to complete the **web app**; the Android/iOS project needs an Android SDK and the Electron
project needs a Windows host to produce and verify installers. `release.yml` already contains
both jobs, gated on the repository variables `ENABLE_ANDROID` / `ENABLE_WINDOWS`, so a web-only
release stays green until those projects land. (Job-level `if` cannot use `hashFiles`; GitHub
rejects such a workflow at parse time. Repository variables are evaluated server-side, which is
why they are used instead.) `docs/SIGNING.md` documents the required secrets.

## D-013 — Local-first data layer with Supabase as the shared backend

Every entity (spaces, chats, notes, quizzes, decks, memories, plans) is persisted in a Zustand
store backed by `localStorage`, using the same shapes as the Postgres schema. Supabase remains
the source of truth when configured: auth, edge functions and RLS are implemented, and the
client switches to them as soon as `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` exist.

Why: the repository must build, pass CI and be usable without production secrets, and the demo
must not be a dead screen. Consequence: cross-device sync requires the Supabase path; the UI
labels demo mode explicitly and the settings screen reports backend status.

## D-012 — Local deterministic generators as AI fallback

`packages/shared/src/generate.ts` produces schema-valid quizzes, flashcard decks, plans and
lessons, extractively when source text is available. The same functions are the offline demo
content source and the fallback when an Edge Function call fails validation twice.

## D-011 — HashRouter everywhere

Packaged targets (Capacitor, Electron, GitHub Pages) have no server-side rewrite. Hash routing
keeps one router for web, PWA and future native wrappers.

## D-010 — Hand-rolled shadcn-style primitives

`apps/web/src/components/ui.tsx` follows shadcn/ui's conventions (cva variants, `cn` helper,
CSS variables, accessible focus rings) without pulling Radix packages the MVP does not need.
Fewer dependencies, identical visual language, easy to swap for real Radix primitives later.

## D-009 — No Husky in this pass

CI enforces `lint`, `typecheck`, `test`, `build` and the Playwright smoke suite on every push,
which is the same gate a pre-commit hook would provide. A local hook that runs the whole
workspace would slow the 100+ commits this scaffold needs. Revisit when the repo is stable.

## D-008 — Edge Functions keep their own Zod schemas

Supabase bundles each function directory; importing TypeScript from `packages/shared` across
the workspace boundary is fragile under `deno` deploy. `supabase/functions/_shared/schemas.ts`
mirrors the shared schemas, and the shared package is still the single source used by the web
client and unit tests.

## D-007 — pnpm installed project-locally for this machine

The workstation blocks global npm installs. `pnpm` was installed under `.tools/` (gitignored)
and added to `PATH` per command. CI uses `pnpm/action-setup@v4`, so no contributor is affected.

## D-006 — SVG PWA icons

Icons are authored as SVG (`apps/web/public/icon.svg`, `maskable.svg`) and referenced from the
manifest with `any maskable`. Avoids shipping binary assets with no source and keeps the icon
editable. A PNG set can be generated from the same SVG when store submission needs it.

## D-005 — Strength semantics

`Bucket` rules: weak topics (`strength < 50`) are always `needs_revision`; otherwise topics past
`nextReviewAt` are `due_today`; strong options (`strength >= 80` and interval >= 7 days) are
`mastered`; everything else is `ok`. Forgiving on purpose: a topic that was learned recently
should not be nagged.

## D-004 — Interval curve

Linear interpolation between anchors `(0,1) (40,1) (50,2) (60,3) (70,5) (80,7) (90,14) (100,21)`
days. Confidence check-ins multiply the computed interval by 0.5 / 1 / 1.5. Intervals are
rounded to one decimal and floored at 0.5 days so a "very unsure" check-in resurfaces the same
day rather than being silently dropped.

## D-003 — Demo mode

Without Supabase env vars the app runs as a fully interactive demo: a local guest session, a
local tutor that streams pre-written structured answers, extractive quiz/flashcard generation,
local SRS and planner. No secret is invented, nothing is faked to look live: the UI shows a
"Demo mode" badge and Settings explains how to connect a real backend.

## D-002 — TypeScript strict, Zod at the boundaries

All AI responses and network payloads are validated. `any` requires a comment. LocalStorage
reads are treated as untrusted and validated on rehydration where they cross a boundary.

## D-001 — Single Vite app, shared logic in a package

`apps/web` is the only UI. `packages/shared` holds SRS, schemas, generators and prompts with
unit tests, so Android/Electron wrappers reuse the exact same logic.
