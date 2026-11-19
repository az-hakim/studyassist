import { app, BrowserWindow, shell } from "electron";

import { APP_ORIGIN, APP_URL } from "./config.js";

/** True only for the wrapped origin — `startsWith` would accept hostile lookalikes. */
function isAppUrl(rawUrl: string): boolean {
  try {
    return new URL(rawUrl).origin === APP_ORIGIN;
  } catch {
    return false;
  }
}

/** Only http(s)/mailto may reach the operating system's default handler. */
function openOutside(rawUrl: string): void {
  try {
    const { protocol } = new URL(rawUrl);
    if (protocol === "https:" || protocol === "http:" || protocol === "mailto:") {
      void shell.openExternal(rawUrl);
    }
  } catch {
    // Malformed URL: nothing to open.
  }
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 420,
    minHeight: 560,
    backgroundColor: "#0b0b12",
    title: "StudyAssistant",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });

  // In-app popups (sign-in) stay in the shell; everything else leaves it.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAppUrl(url)) return { action: "allow" };
    openOutside(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (isAppUrl(url)) return;
    event.preventDefault();
    openOutside(url);
  });

  win.webContents.on("did-fail-load", (_event, code, description, url) => {
    console.error(`[studyassistant] failed to load ${url} (${code} ${description})`);
  });

  void win.loadURL(APP_URL);
  return win;
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const [win] = BrowserWindow.getAllWindows();
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });

  void app.whenReady().then(() => {
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
