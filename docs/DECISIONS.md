# Decisions

## D-016 — The app is a wrapper around studyassistant.in (supersedes D-001–D-015)

The requirement is an app that opens studyassistant.in, not a second implementation of the
product. Everything that reimplemented the site — the React app, Supabase schema and Edge
Functions, the shared package, the public marketing pages — was removed. The previous
implementation is preserved in git history at commit `ed9971f` (`chore: snapshot pre-wrapper
implementation`) if it is ever needed again.

What replaced it:

- `apps/web` — a Vite launcher page that hands off to the site (`?stay=1` keeps the splash).
- `apps/desktop` — Electron shell that loads the site in a `BrowserWindow` with
  `contextIsolation`, `sandbox`, no Node integration, and external links in the system browser.
- `apps/android` — Capacitor config with `server.url` set to the site, so the WebView shows it.

Consequences:

- No local data model, no auth code, no AI keys anywhere in this repo. Sessions and accounts
  come from the site itself.
- The web target cannot embed the site in an iframe (the site does not allow framing), so it
  navigates to it instead.
- Offline behaviour is the browser's: the launcher page is static, the wrapped site needs a
  connection.
