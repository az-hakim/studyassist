import { defineConfig } from "vite";

// Relative base so the same build works from a static host, a file:// URL
// (Electron) and the Capacitor WebView.
export default defineConfig({
  base: "./",
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: { outDir: "dist", emptyOutDir: true },
});
