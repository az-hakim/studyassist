// The app is a wrapper: the product lives at https://www.studyassistant.in and
// every target opens it. Override with VITE_APP_URL (or STUDYASSISTANT_URL for
// the desktop shell) when pointing at a staging origin.
const DEFAULT_SITE_URL = "https://www.studyassistant.in";
const SITE_URL = (import.meta.env.VITE_APP_URL as string | undefined) || DEFAULT_SITE_URL;

const link = document.getElementById("site-link");
if (link instanceof HTMLAnchorElement) link.href = SITE_URL;

const urlLabel = document.getElementById("site-url");
if (urlLabel) urlLabel.textContent = SITE_URL.replace(/^https?:\/\//, "");

// `?stay=1` keeps the launcher on screen (useful for packaging checks).
const stay = new URLSearchParams(window.location.search).has("stay");

if (!stay) {
  window.setTimeout(() => window.location.replace(SITE_URL), 350);
}
