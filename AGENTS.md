# AGENTS.md — AI Study Assistant (Web + Android APK + Windows EXE)

> Instructions for the coding agent. Read this file fully before writing code.
> Follow it in order. When something is ambiguous, pick the simplest option that satisfies the "Definition of Done" and note the decision in `docs/DECISIONS.md`.

---

## 0. Mission

Build **one codebase** that ships as:

1. a **web app** (PWA, deployed to a static host),
2. a **signed Android APK** (plus optional AAB),
3. a **signed Windows installer (.exe)**,

all produced automatically by **GitHub Actions** when a version tag (`v*`) is pushed.

The product is an **AI study assistant for students**, inspired by the feature set of studyassistant.in. Replace `<APP_NAME>` and `<AI_BUDDY_NAME>` with the owner's own brand names. See `docs/BRAND.md`; if missing, use placeholders `StudyBuddy` and `Nova`.

### Legal and originality rules (important)

- Rebuild **functionality**, not the original. Do **not** copy studyassistant.in's code, copy text, logo, illustrations, the name "StudyAssistant", or the name "Aeva".
- Write original UI, copy, and assets. Use open-licensed icons (lucide) and fonts (Inter / system).
- Do not scrape the reference site. Everything needed is specified below.

---

## 1. Feature scope

### MVP (Phase 1–3, must ship)

| Module | Behavior |
|---|---|
| **Auth** | Google sign-in + email magic link. Guests may try a limited demo chat. |
| **AI Chat** | Streaming answers, markdown + code + tables, math rendering, per-subject context, stop/regenerate. |
| **Chat with files** | Upload PDF / image / text. Chunk + embed. Answers cite the page number. |
| **Web-grounded answers** | Optional toggle. Show source cards (title, domain, favicon, link). |
| **Quiz generator** | From topic, chat answer, or file. MCQ single, MCQ multi, true/false. Difficulty selector. Instant grading + AI feedback. |
| **Flashcards** | Generate deck from topic/answer/file/quiz. Flip, shuffle, rate: Easy / Medium / Hard / Needs Revision. |
| **Notes** | Markdown editor. "Save answer as note". Export to PDF. Public share link. |
| **Study Spaces** | Per-subject workspace holding chats, notes, quizzes, decks, files. Per-space progress and weak topics. |
| **Revision mode** | Spaced repetition: memory strength per topic, next review date, reason text, confidence check-in (😕 🙂 😎), streaks. |
| **Exam prep planner** | Inputs: exam name, date, class/stream, subjects, daily hours. AI builds day-by-day plan from syllabus. Each topic has: AI lesson, quiz, flashcards, scoped doubt box, timer, status (not started / in progress / done). |

### Phase 4 (after MVP is green in CI)

- Learning analytics dashboard (study time, streaks, quiz trends, subject breakdown, achievements).
- Bookmarks and global search.
- AI diagrams (generate SVG or Mermaid inside answers).
- Public share links for quizzes (attempt without account) and quiz results.
- Learning profile (education level, language, explanation style) injected into every prompt.

### Explicit non-goals

- Entrance-exam deep prep (JEE, NEET, UPSC).
- iOS and macOS builds.
- Payments.

---

## 2. Locked tech stack

Do not swap these without writing a justification in `docs/DECISIONS.md`.

| Layer | Choice |
|---|---|
| Language | TypeScript (strict) everywhere |
| Web UI | React 18 + Vite + React Router |
| Styling | Tailwind CSS + shadcn/ui primitives, dark and light theme |
| State / data | TanStack Query + Zustand |
| Backend | **Supabase**: Postgres, Auth, Storage, `pgvector`, Edge Functions (Deno) |
| AI | Provider-agnostic gateway inside Edge Functions (default: Anthropic Claude via API; interface allows swapping). **No AI keys in the client. Ever.** |
| Android | **Capacitor 6** (wraps the same Vite build) |
| Windows | **Electron + electron-builder** (NSIS installer) |
| PWA | `vite-plugin-pwa` |
| Tests | Vitest (unit), Playwright (web e2e smoke) |
| Lint / format | ESLint + Prettier + `tsc --noEmit` |
| Package manager | **pnpm** (via `corepack`), Node 20 LTS |
| CI/CD | GitHub Actions |

---

## 3. Repository layout

```
.
├── AGENTS.md
├── apps/
│   ├── web/                 # React + Vite app (single source of UI)
│   ├── android/             # Capacitor Android project (generated, committed)
│   └── desktop/             # Electron main/preload + electron-builder config
├── supabase/
│   ├── migrations/          # SQL, numbered
│   ├── functions/           # Edge Functions (chat, quiz, flashcards, plan, lesson, embed, search)
│   └── seed.sql
├── packages/
│   └── shared/              # Zod schemas, types, prompt templates, SRS logic
├── .github/workflows/
│   ├── ci.yml
│   └── release.yml
├── docs/
│   ├── BRAND.md
│   ├── DECISIONS.md
│   ├── SIGNING.md           # how to create keystore / cert / set secrets
│   └── RELEASE.md
└── package.json             # pnpm workspace root
```

Use a pnpm workspace (`pnpm-workspace.yaml`). All business logic that is not UI lives in `packages/shared` with unit tests.

---

## 4. Build order (follow strictly)

Commit after each step. Keep `main` green.

### Phase 0 — Scaffold
1. Init pnpm workspace, TypeScript, ESLint, Prettier, Husky pre-commit (lint + typecheck).
2. Create `apps/web` with Vite + React + Tailwind + shadcn/ui. Responsive: must work at 360 px width and at 1440 px.
3. Add PWA manifest, icons (generated from one SVG), service worker.
4. Add `ci.yml` (see §9). It must pass before moving on.

### Phase 1 — Backend and auth
1. Supabase project config, migrations for the schema in §5, RLS on **every** table (users only read/write their own rows; public share tables are read-only by token).
2. Google OAuth + magic link in the web app.
3. Native-friendly auth redirects (see §7).

### Phase 2 — Core learning loop
1. Chat (streaming via SSE from an Edge Function).
2. File upload, chunking, embeddings, retrieval with page citations.
3. Quiz generator and grader.
4. Flashcards.
5. Notes editor and PDF export.
6. Study Spaces.

### Phase 3 — Revision and exam prep
1. SRS engine in `packages/shared` (§6) with full unit tests.
2. Revision dashboard.
3. Exam planner, lesson generator, per-topic practice screen.

### Phase 4 — Packaging (do this earlier if you can; it de-risks the project)
1. Capacitor Android project, local debug build works.
2. Electron wrapper, local `pnpm desktop:dist` works on Windows.
3. `release.yml` produces signed artifacts (§9).

### Phase 5 — Polish
Analytics, bookmarks, search, sharing, diagrams, learning profile, accessibility pass, Lighthouse PWA score ≥ 90.

---

## 5. Data model (Postgres)

Create with migrations. All tables have `id uuid pk default gen_random_uuid()`, `user_id uuid references auth.users`, `created_at`, `updated_at`. RLS: `user_id = auth.uid()`.

- `profiles` — display_name, education_level, language, explanation_style
- `spaces` — name, subject, color
- `chats`, `messages` — space_id nullable; message has role, content, sources jsonb, tool jsonb
- `files` — space_id, storage_path, mime, pages
- `file_chunks` — file_id, page, content, `embedding vector(1536)` (ivfflat/hnsw index)
- `notes` — space_id, title, markdown, share_token nullable
- `quizzes`, `quiz_questions`, `quiz_attempts` — type (`single|multi|tf`), options jsonb, answer jsonb, explanation, share_token nullable
- `decks`, `cards`, `card_reviews` — rating enum (`easy|medium|hard|needs_revision`)
- `topics` — space_id, name; the unit SRS tracks
- `topic_memory` — topic_id, strength (0–100), last_studied_at, next_review_at, reason text, streak counters
- `exam_plans`, `plan_days`, `plan_topics` — exam_name, exam_date, daily_minutes; topic status `not_started|in_progress|done`; `lesson_markdown` cached
- `study_sessions` — duration, topic_id, kind
- `bookmarks` — entity_type, entity_id, folder

Public share: separate `SECURITY DEFINER` RPCs that fetch by `share_token`. Never open the base tables to anon.

---

## 6. Spaced-repetition engine (`packages/shared/src/srs.ts`)

Pure functions, no I/O, fully unit-tested.

```ts
type Signal =
  | { kind: "quiz"; scorePct: number }                 // 0–100
  | { kind: "card"; rating: "easy" | "medium" | "hard" | "needs_revision" }
  | { kind: "confidence"; level: 1 | 2 | 3 };          // 😕 🙂 😎

function updateMemory(prev: TopicMemory, signal: Signal, now: Date): TopicMemory
function reasonFor(mem: TopicMemory, now: Date): string  // e.g. "You scored 58% on this 3 days ago."
function bucket(mem: TopicMemory, now: Date): "needs_revision" | "due_today" | "mastered" | "ok"
```

Rules:
- New topic starts at strength 40, interval 1 day.
- Quiz score maps to a target strength; blend 60% new, 40% old.
- Card ratings nudge strength: easy +8, medium +3, hard −6, needs_revision −12 (clamp 0–100).
- Confidence: 😕 −10 and interval ×0.5, 🙂 +0, 😎 +8 and interval ×1.5.
- `next_review_at = last_studied_at + interval`, where interval grows with strength (≈1d below 40, 3d at 60, 7d at 80, 14d+ at 90+).
- `reasonFor` must always return a concrete, human sentence naming the most recent signal.

Write at least 25 unit tests including edge cases (clamping, overdue, first review).

---

## 7. AI layer

All AI calls go through Supabase Edge Functions. The client sends a user JWT; functions verify it, rate-limit per user, and call the model.

Functions: `chat` (SSE streaming), `quiz-generate`, `quiz-grade`, `flashcards-generate`, `plan-generate`, `lesson-generate`, `embed-file`, `web-search`.

Rules:
- Every structured output (quiz, plan, flashcards) is requested as JSON and **validated with Zod** from `packages/shared`. On failure, retry once with the validation error, then return a friendly error.
- Prompt templates live in `packages/shared/src/prompts/`. Inject the learning profile (level, language, style) into the system prompt.
- Chat with files: retrieve top-k chunks by cosine similarity, put them in context, require the model to cite `[p. N]`; render as clickable chips.
- Web search: use a pluggable provider (default: model's built-in search tool or Brave/Tavily via env). Return `sources: [{title, url, domain}]`.
- Exam plan generator: ask the model for the syllabus, topics, and day allocation that fits `exam_date` and `daily_minutes`. Persist, then lazily generate each lesson on first open (sections: Why it matters, Core ideas, Worked examples, Things to remember, Common mistakes, Self-check).
- Add per-user daily token budget and return a clear "limit reached" state.
- Never log prompts that contain user file contents.

### Native auth redirects

- **Web:** standard Supabase OAuth redirect.
- **Android (Capacitor):** use the system browser plus a custom-scheme deep link (`<app-id>://auth-callback`) handled by `@capacitor/app` `appUrlOpen`, then exchange the code with Supabase (PKCE).
- **Electron:** open the system browser for OAuth; capture the callback through a registered protocol (`<app-id>://`) or a short-lived loopback `http://127.0.0.1:<port>` listener in the main process; pass the code to the renderer via a typed `contextBridge` API.
- Add all redirect URLs to Supabase Auth settings and document them in `docs/RELEASE.md`.

---

## 8. Platform packaging details

### 8.1 Android (Capacitor)

- `capacitor.config.ts`: `appId: "com.<owner>.<appname>"`, `webDir: "apps/web/dist"`.
- Commit `apps/android`. Set `minSdkVersion 24`, `targetSdkVersion` = latest stable Google Play requirement.
- `versionCode` = `GITHUB_RUN_NUMBER` in CI; `versionName` = tag without the `v`.
- Configure **release signing from environment variables** in `apps/android/app/build.gradle`:

```gradle
android {
  signingConfigs {
    release {
      def ksPath = System.getenv("ANDROID_KEYSTORE_PATH")
      if (ksPath) {
        storeFile file(ksPath)
        storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
        keyAlias System.getenv("ANDROID_KEY_ALIAS")
        keyPassword System.getenv("ANDROID_KEY_PASSWORD")
      }
    }
  }
  buildTypes {
    release {
      minifyEnabled true
      proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
      signingConfig signingConfigs.release
    }
  }
}
```

- Plugins to include: `@capacitor/app`, `@capacitor/browser`, `@capacitor/filesystem`, `@capacitor/share`, `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor/local-notifications` (revision reminders).

### 8.2 Windows (Electron)

- `apps/desktop/main.ts`: create `BrowserWindow` loading the built web app from `file://` (or a custom `app://` protocol), `contextIsolation: true`, `nodeIntegration: false`, strict CSP, single-instance lock, external links open in the default browser.
- `electron-builder.yml`: target `nsis` (x64), `artifactName: "${productName}-Setup-${version}.${ext}"`, `appId` matching Android, `win.signingHashAlgorithms: [sha256]`.
- Auto-update is optional (Phase 5): `electron-updater` using GitHub Releases.

### 8.3 Web

- Build to `apps/web/dist`. Deploy to GitHub Pages **or** Cloudflare Pages / Netlify / Vercel (owner decides; default to Cloudflare Pages through `cloudflare/wrangler-action` if secrets exist, else skip the step gracefully).
- Use `HashRouter` or SPA fallback config so deep links work on all targets. Packaged apps (Capacitor/Electron) **must** use hash routing or in-memory routing, since there is no server to rewrite paths.

---

## 9. CI/CD (GitHub Actions)

### 9.1 `ci.yml` — on every PR and push to `main`

Jobs: install (pnpm cache) → `lint` → `typecheck` → `test` (Vitest) → `build web` → Playwright smoke test (landing + sign-in screen render). Fail fast. Pin all third-party actions to a major version or SHA.

### 9.2 `release.yml` — on tags `v*.*.*`

```yaml
name: Release
on:
  push:
    tags: ["v*.*.*"]
permissions:
  contents: write

jobs:
  web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter web build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: actions/upload-artifact@v4
        with: { name: web-dist, path: apps/web/dist }

  android:
    needs: web
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: 17 }
      - uses: android-actions/setup-android@v3
      - run: pnpm install --frozen-lockfile
      - uses: actions/download-artifact@v4
        with: { name: web-dist, path: apps/web/dist }
      - run: pnpm exec cap sync android
      - name: Decode keystore
        run: echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > "$RUNNER_TEMP/release.jks"
      - name: Set version
        run: |
          VERSION=${GITHUB_REF_NAME#v}
          sed -i "s/versionCode .*/versionCode ${GITHUB_RUN_NUMBER}/" apps/android/app/build.gradle
          sed -i "s/versionName .*/versionName \"${VERSION}\"/" apps/android/app/build.gradle
      - name: Build signed APK and AAB
        working-directory: apps/android
        env:
          ANDROID_KEYSTORE_PATH: ${{ runner.temp }}/release.jks
          ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          ANDROID_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
        run: ./gradlew assembleRelease bundleRelease
      - name: Verify APK signature
        run: |
          APKSIGNER=$(find "$ANDROID_HOME/build-tools" -name apksigner | sort | tail -n1)
          "$APKSIGNER" verify --print-certs apps/android/app/build/outputs/apk/release/*.apk
      - name: Rename artifacts
        run: |
          mkdir -p out
          cp apps/android/app/build/outputs/apk/release/*.apk "out/<APP_NAME>-${GITHUB_REF_NAME}.apk"
          cp apps/android/app/build/outputs/bundle/release/*.aab "out/<APP_NAME>-${GITHUB_REF_NAME}.aab"
      - uses: actions/upload-artifact@v4
        with: { name: android, path: out/* }

  windows:
    needs: web
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - uses: actions/download-artifact@v4
        with: { name: web-dist, path: apps/web/dist }
      - name: Build signed installer
        run: pnpm --filter desktop dist
        env:
          CSC_LINK: ${{ secrets.WIN_CSC_LINK }}            # base64 PFX or https URL
          CSC_KEY_PASSWORD: ${{ secrets.WIN_CSC_KEY_PASSWORD }}
      - name: Verify signature
        shell: pwsh
        run: |
          Get-ChildItem apps/desktop/release/*.exe | ForEach-Object {
            $sig = Get-AuthenticodeSignature $_.FullName
            Write-Host "$($_.Name): $($sig.Status)"
            if ($sig.Status -ne 'Valid' -and $env:REQUIRE_WIN_SIGNATURE -eq 'true') { exit 1 }
          }
        env:
          REQUIRE_WIN_SIGNATURE: ${{ vars.REQUIRE_WIN_SIGNATURE }}
      - uses: actions/upload-artifact@v4
        with: { name: windows, path: apps/desktop/release/*.exe }

  release:
    needs: [android, windows]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with: { path: dist, merge-multiple: true }
      - uses: softprops/action-gh-release@v2
        with:
          files: dist/*
          generate_release_notes: true
```

Adjust paths to match the real project. The workflow must be **re-runnable** and must never print secrets.

### 9.3 Required GitHub secrets / variables

| Name | Purpose |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Public client config baked into builds |
| `ANDROID_KEYSTORE_BASE64` | Base64 of the release `.jks` |
| `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | Keystore credentials |
| `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD` | Windows code-signing certificate (PFX, base64) and password |
| `vars.REQUIRE_WIN_SIGNATURE` | `true` once a real certificate exists |
| Edge Function secrets (set in Supabase, **not** GitHub) | `AI_API_KEY`, `SEARCH_API_KEY` |

### 9.4 Signing notes (write these into `docs/SIGNING.md`)

**Android**
- Generate once, locally: `keytool -genkeypair -v -keystore release.jks -alias <alias> -keyalg RSA -keysize 2048 -validity 10000`
- Back it up offline. **If the keystore is lost, updates to the same app can never be published.**
- Encode for GitHub: `base64 -w0 release.jks` (Linux) and paste into the secret.
- Never commit `.jks`, `.pfx`, or passwords. Add them to `.gitignore`.

**Windows**
- A real Authenticode certificate costs money. Options: a standard or EV code-signing certificate (PFX in secrets), **Azure Trusted Signing**, or **SignPath Foundation** (free for qualifying open-source projects).
- Until a certificate exists, CI must still build an **unsigned** installer, log a clear warning, and **not fail** (`REQUIRE_WIN_SIGNATURE` unset). Document that Windows SmartScreen will warn users of unsigned builds.
- A self-signed certificate is acceptable for internal testing only.

---

## 10. Engineering rules

- TypeScript strict, no `any` without a comment. Zod-validate every network boundary.
- Accessibility: keyboard navigable, labels on inputs, color contrast AA, reduced-motion respected.
- Offline: cache the app shell; show friendly offline states; queue note edits locally.
- Mobile first: touch targets ≥ 44 px, safe-area insets, `interactive-widget=resizes-content` so the keyboard doesn't cover the chat input.
- Errors: no raw stack traces in UI. Log to console in dev only.
- Security: RLS on every table, CSP in Electron and web, no secrets in the repo or the client bundle, rate-limit Edge Functions, sanitize rendered markdown (DOMPurify).
- Privacy: provide in-app "Delete my data" that removes rows and storage objects.
- Commits: Conventional Commits. One feature per PR-sized commit.
- Docs: keep `README.md` current with the exact commands to run, test, and release.

### Commands that must exist in the root `package.json`

```
pnpm dev                # web dev server
pnpm lint
pnpm typecheck
pnpm test
pnpm build              # web production build
pnpm android:sync       # build web + cap sync
pnpm android:debug      # local debug APK
pnpm desktop:dev        # Electron against the dev server
pnpm desktop:dist       # local Windows installer
```

---

## 11. Definition of Done

The project is done when **all** are true:

1. `ci.yml` is green on `main`.
2. Pushing tag `v0.1.0` runs `release.yml` and attaches to the GitHub Release: `<APP_NAME>-v0.1.0.apk`, `<APP_NAME>-v0.1.0.aab`, and `<APP_NAME>-Setup-0.1.0.exe`.
3. `apksigner verify` passes on the APK in CI. The EXE is signed when certificate secrets are present.
4. The APK installs and launches on a real Android device or emulator; Google sign-in, chat streaming, quiz, flashcards, and revision dashboard work.
5. The EXE installs on Windows 10/11 and the same flows work.
6. The web app deploys, installs as a PWA, and Lighthouse PWA score is ≥ 90.
7. All SRS unit tests pass; RLS tests prove user A cannot read user B's rows.
8. `README.md`, `docs/SIGNING.md`, and `docs/RELEASE.md` let a new developer reproduce a release without asking questions.

---

## 12. When you are blocked

- Missing secret or account (keystore, certificate, API key): do **not** invent values. Build everything else, make the step skip with a clear log message, and list the exact manual action needed at the top of your final report.
- Unclear product decision: choose the simplest option, record it in `docs/DECISIONS.md`, keep moving.
- At the end, output a short report: what works, what was skipped, and the exact manual steps for the owner.
