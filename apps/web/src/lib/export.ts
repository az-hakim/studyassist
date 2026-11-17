function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Opens a print-ready window with the already-sanitised rendered HTML.
 * The user can "Save as PDF" from the browser print dialog.
 */
export function printDocument(title: string, html: string): boolean {
  const win = window.open("", "_blank", "width=900,height=1100");
  if (!win) return false;

  win.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #111827; max-width: 760px; margin: 40px auto; padding: 0 24px; line-height: 1.65; }
    h1 { font-size: 26px; margin: 0 0 4px; letter-spacing: -0.02em; }
    .meta { color: #6b7280; font-size: 12px; margin-bottom: 28px; }
    h2 { font-size: 19px; margin: 26px 0 8px; }
    h3 { font-size: 16px; margin: 20px 0 6px; }
    p, li { font-size: 14px; }
    ul, ol { padding-left: 22px; }
    code { background: #f3f4f6; padding: 1px 5px; border-radius: 4px; font-size: 12px; }
    pre { background: #0d1117; color: #e6edf3; padding: 14px; border-radius: 10px; overflow: auto; }
    pre code { background: transparent; color: inherit; padding: 0; }
    blockquote { border-left: 3px solid #c7d2fe; margin: 12px 0; padding: 2px 14px; color: #4b5563; }
    table { border-collapse: collapse; width: 100%; font-size: 13px; margin: 12px 0; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; }
    th { background: #f9fafb; }
    a { color: #4f46e5; }
    @page { margin: 18mm; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">Exported from StudyBuddy on ${escapeHtml(new Date().toLocaleString())}</p>
  ${html}
</body>
</html>`);
  win.document.close();
  win.focus();
  window.setTimeout(() => win.print(), 400);
  return true;
}

export function downloadTextFile(filename: string, content: string, mime = "text/markdown"): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
