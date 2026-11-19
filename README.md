# StudyAssistant app

A thin wrapper around **[studyassistant.in](https://www.studyassistant.in)**. The product,
content and account system live on the site; this repository only contains the shells that
open it, and none of the site's code.

Launching any target loads `https://www.studyassistant.in`.

| Target | How it opens the site | Entry point |
|---|---|---|
| Web / PWA | Launcher page hands off to the site immediately | `apps/web` |
| Windows (.exe) | Electron window loads the site directly | `apps/desktop` |
| Android (.apk) | Capacitor WebView loads the site (`server.url`) | `apps/android` |

## Commands

```bash
corepack enable
corepack prepare pnpm@9 --activate
pnpm install

pnpm dev            # launcher at http://localhost:5173 (redirects to the site)
pnpm build          # static build of the launcher -> apps/web/dist
pnpm preview        # serve that build at http://localhost:4173

pnpm desktop:dev    # Electron shell against the live site
pnpm desktop:dist   # unsigned Windows installer -> apps/desktop/release

pnpm android:add    # generate apps/android/android (needs the build first)
pnpm android:sync   # rebuild launcher + sync into the Android project
pnpm android:debug  # debug APK via Gradle (needs the Android SDK)
```

## Changing the wrapped URL

- Web: `VITE_APP_URL` at build time (defaults to `https://www.studyassistant.in`).
- Desktop: `STUDYASSISTANT_URL` environment variable.
- Android: `server.url` in `apps/android/capacitor.config.ts`.

## Not included

The site's application code, database, AI functions and design do not live here. This repo
does not build or deploy the site — only the shells that open it.

## Signing

See `docs/SIGNING.md`. Windows and Android artifacts are unsigned unless the certificate /
keystore secrets described there are present.
