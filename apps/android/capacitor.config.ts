import type { CapacitorConfig } from "@capacitor/cli";

// The Android build is a shell around the live site: `server.url` makes the
// WebView open studyassistant.in directly. `webDir` only needs the launcher
// build as an offline fallback for `cap add`/`cap sync`.
const config: CapacitorConfig = {
  appId: "in.studyassistant.app",
  appName: "StudyAssistant",
  webDir: "../web/dist",
  server: {
    url: "https://www.studyassistant.in",
    androidScheme: "https",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
