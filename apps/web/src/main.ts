// The product lives at https://www.studyassistant.in; this page only hands off.
// VITE_APP_URL overrides the destination (e.g. a staging origin).
const SITE_URL = import.meta.env.VITE_APP_URL || "https://www.studyassistant.in";

for (const link of document.querySelectorAll<HTMLAnchorElement>("a[data-site-link]")) {
  link.href = SITE_URL;
}

// `?stay=1` keeps the splash on screen for packaging checks.
if (!new URLSearchParams(window.location.search).has("stay")) {
  window.setTimeout(() => window.location.replace(SITE_URL), 350);
}
