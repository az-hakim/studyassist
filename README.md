# StudyAssistant

An AI study assistant for students: a streaming tutor, quizzes, flashcards, notes, study
spaces, spaced repetition and an exam-prep planner — built as one TypeScript codebase that
ships as a **PWA**, and (in later phases) an **Android APK** and a **Windows installer**.

> Aeva is the in-app tutor. See `docs/BRAND.md`.

## Status

| Area | State |
|---|---|
| Web app (PWA) | ✅ MVP complete |
| Spaced-repetition engine | ✅ 30+ unit tests |
| Supabase schema, RLS, Edge Functions | ✅ written, needs a project to run |
| CI | ✅ lint · typecheck · test · build · Playwright smoke |
| Android / Windows packaging | ⏳ Phase 4 (workflow jobs ready, projects not scaffolded) |

Without Supabase credentials the app boots in **demo mode**: local guest session, local tutor,
extractive quiz/flashcard generation, local SRS. Settings shows the backend status.

## Quick start

```bash
corepack enable
corepack prepare pnpm@9 --activate
pnpm install
pnpm dev            # http://localhost:5173
```

A demo workspace is seeded on first load, so the dashboard, chat, quizzes, flashcards, notes,
revision and planner are all usable immediately.

To connect a real backend:

```bash
cp .env.example .env
# fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then:
supabase db push
supabase functions deploy
```

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Vite dev server |
| `pnpm build` | Production PWA build to `apps/web/dist` |
| `pnpm preview` | Preview the production build |
| `pnpm lint` | ESLint over the workspace |
| `pnpm typecheck` | `tsc --noEmit` in every package |
| `pnpm test` | Vitest (SRS, schemas, generators, web logic) |
| `pnpm e2e` | Playwright smoke tests (needs Chromium) |
| `pnpm format` | Prettier |

## Structure

```
apps/web                 React 18 + Vite + Tailwind + React Router (HashRouter)
packages/shared          SRS engine, Zod schemas, prompts, local generators (tested)
supabase/migrations      Postgres schema, RLS, pgvector, public share RPCs
supabase/functions       Deno Edge Functions (chat SSE, quiz, flashcards, plan, lesson, embed)
.github/workflows        ci.yml (every push/PR), release.yml (tags v*.*.*)
docs                     brand, decisions, signing, release
```

## Architecture notes

- **AI keys never reach the browser.** All model calls go through Edge Functions that verify
  the user JWT, apply a per-user daily token budget and validate structured output with Zod,
  retrying once with the validation error.
- **Retrieval and citations.** File chunks are embedded with `text-embedding-3-small` (1536
  dimensions) and stored in `file_chunks.embedding` with an ivfflat index. Chat requests pass
  the top-k chunks and ask the model to cite `[p. N]`, which the UI renders as page chips.
- **Spacing.** `packages/shared/src/srs.ts` is pure and deterministic: strength blending,
  interval interpolation, bucket assignment and a concrete human `reason` per topic.
- **Demo mode.** `packages/shared/src/generate.ts` produces schema-valid quizzes, decks, plans
  and lessons locally, with extractive questions when source text exists.
- **Routing.** `HashRouter` so packaged targets and static hosts need no rewrite rules.

## Security

- RLS on every table, scoped to `auth.uid()`; public sharing only through `SECURITY DEFINER`
  RPCs that take a token. No base table is readable by `anon`.
- Markdown is rendered without raw HTML and sanitised (`rehype-sanitize`); no `dangerouslySetInnerHTML`.
- No secrets in the repo, client bundle or logs. Prompts containing file contents are never logged.

## Docs

- `docs/DECISIONS.md` — why the app is built this way
- `docs/SIGNING.md` — Android keystore and Windows certificate setup
- `docs/RELEASE.md` — tagging, artifacts, deployment and Supabase wiring
