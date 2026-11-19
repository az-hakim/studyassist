# AGENTS.md — StudyAssistant app (wrapper)

## What this repo is

A thin wrapper around **https://www.studyassistant.in**. The product, its copy, its design and
its backend live on that site. This repository must not contain a second implementation of it.

Three targets, all of which open the website:

1. `apps/web` — Vite launcher page; hands off to the site (`?stay=1` keeps the splash).
2. `apps/desktop` — Electron `BrowserWindow` loading the site.
3. `apps/android` — Capacitor `server.url` pointing at the site.

The site URL is configured in `apps/web` (`VITE_APP_URL`), `apps/desktop/src/config.ts`
(`STUDYASSISTANT_URL`) and `apps/android/capacitor.config.ts` (`server.url`).

## Rules

- Do not add product features, backend code, database schema, auth flows or AI calls here.
  If the wrapped site needs something, it changes on the site.
- Do not embed the site in an `<iframe>`: it forbids framing. Navigate to it.
- Keep the shell minimal and secure on desktop: `contextIsolation: true`,
  `nodeIntegration: false`, `sandbox: true`, no remote module, external links open in the
  system browser.
- TypeScript strict. No secrets in the repo or the bundle — there should be none at all.
- Commits: Conventional Commits, one concern per commit.

## Commands

```bash
pnpm install
pnpm dev            # launcher (redirects to the site)
pnpm build          # apps/web/dist
pnpm typecheck
pnpm desktop:dev
pnpm desktop:dist   # Windows installer (unsigned without certificates)
pnpm android:add    # generate the native project (after pnpm build)
pnpm android:sync
pnpm android:debug  # needs the Android SDK
```

## Definition of done

- `pnpm typecheck` and `pnpm build` pass, and CI is green on `main`.
- Every target opens studyassistant.in when launched.
- No site code, schema or secrets are duplicated in this repo.
