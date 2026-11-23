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

## Releases (CI/CD)

Both pipelines live in `.github/workflows` and need no secrets to run.

- **`ci.yml`** — every push to `main` and every pull request: install, `pnpm typecheck`,
  `pnpm build`, and the Electron build check.
- **`release.yml`** — every `v*.*.*` tag: builds each target on GitHub-hosted runners and
  attaches the results to a GitHub Release.

| Artifact | Job | File in the release |
|---|---|---|
| Windows installer | `windows` (`windows-latest`) | `StudyAssistant-Setup-<version>.exe` |
| Android app | `android` (JDK 17, SDK 34) | `StudyAssistant-<version>.apk` |
| Web launcher | `web` | `StudyAssistant-<tag>-web.zip` |

Cutting a release:

```bash
git tag v0.3.0        # or v0.3.0-rc.1 for a pre-release
git push origin v0.3.0
gh run watch          # follow the Release workflow to completion
```

Tags containing a hyphen (`v0.3.0-rc.1`) publish as GitHub pre-releases; plain `vX.Y.Z`
tags become the latest stable release. Delete a bad tag with
`gh release delete <tag> --yes --cleanup-tag`.

The tag is also the artifact version. The Windows job stamps `package.json` and
`apps/desktop/package.json` from the tag before building (and fails if the installer is not
named after it), and the Android job maps `v0.3.1` to `versionName 0.3.1` /
`versionCode 301` (see `docs/SIGNING.md`), so a release never reuses an older name and every
APK can install over the previous one. Committed manifest versions can lag the tag; CI fixes
them up per run.

The installer and the Android APK are signed only when the secrets in `docs/SIGNING.md` are
set. Without them the workflow falls back to the debug-signed APK, which installs on a device
for testing but is not Play Store ready.

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
