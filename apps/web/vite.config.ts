import { defineConfig } from "vite";

// Relative base so the build works from a static host and inside the
// Capacitor WebView without rewrite rules.
export default defineConfig({
  base: "./",
  server: { port: 5173, strictPort: true },
});
