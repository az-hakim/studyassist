# Release

## Prerequisites

- Node 20+, pnpm 9 (`corepack enable && corepack prepare pnpm@9 --activate`)
- GitHub CLI authenticated: `gh auth login`
- Repository secrets listed in §9.3 of `AGENTS.md`

## 1. Verify main

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e        # needs `pnpm --filter @studybuddy/web exec playwright install chromium`
```

All five must pass before tagging.

## 2. Cut the release

```bash
git checkout main && git pull
git tag v0.1.0
git push origin v0.1.0
```

`release.yml` then:

1. builds the PWA and zips `apps/web/dist`,
2. (when present) builds the signed APK/AAB and verifies the signature,
3. (when present) builds and verifies the Windows NSIS installer,
4. publishes a GitHub Release with every artifact attached.

The Android and Windows jobs are gated on repository **variables** so a web-only
release stays green before those projects are scaffolded:

```bash
gh variable set ENABLE_ANDROID --body true
gh variable set ENABLE_WINDOWS --body true
```

Set them only after `apps/android` (with `gradlew`) and `apps/desktop` exist.

Re-running a failed release is safe: re-push the tag (`git push --force origin v0.1.0` after
deleting it) or use **Re-run all jobs** in the Actions UI. No step prints secrets.

## 3. Deploy the web build

The build is a static site in `apps/web/dist`. Any static host works; hash routing means no
rewrite rules are required.

**Cloudflare Pages** (recommended):

```bash
pnpm build
npx wrangler pages deploy apps/web/dist --project-name studybuddy
```

**GitHub Pages**: publish `apps/web/dist` with `actions/deploy-pages`, or commit it to a
`gh-pages` branch. Because the app uses `HashRouter`, deep links work without 404 fallbacks.

## 4. Supabase setup

```bash
supabase link --project-ref <project-ref>
supabase db push                      # applies supabase/migrations
supabase functions deploy            # deploy all Edge Functions
supabase secrets set AI_API_KEY=... SEARCH_API_KEY=...
```

Add these redirect URLs in **Authentication → URL Configuration**:

| Target | URL |
|---|---|
| Web dev | `http://localhost:5173/#/app` |
| Web preview | `https://<preview-host>/#/app` |
| Production | `https://<production-host>/#/app` |
| Android | `com.azhakim.studybuddy://auth-callback` |
| Electron | `com.azhakim.studybuddy://auth-callback` and `http://127.0.0.1:53682/auth-callback` |

Google OAuth: enable the provider in Supabase and paste the Supabase callback URL into the
Google Cloud console.

Then set the build-time variables:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Both are public values and safe to bake into the bundle. **Never** put the service role key or
`AI_API_KEY` in the client.

## 5. Post-release checklist

- [ ] `gh release view v0.1.0` lists the web zip (and APK/AAB/EXE when scaffolded).
- [ ] Deployed site installs as a PWA and serves the offline shell.
- [ ] Sign-in works on the deployed origin.
- [ ] `VITE_SUPABASE_*` values in the build match the intended project.
