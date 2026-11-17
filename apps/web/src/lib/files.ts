export interface FilePage {
  page: number;
  text: string;
}

export interface ExtractedFile {
  name: string;
  mime: string;
  size: number;
  pages: number;
  kind: "text" | "pdf" | "image" | "other";
  text: string;
  chunks: FilePage[];
  warning?: string;
}

const CHARS_PER_PAGE = 2000;

/** Split text into page-ish chunks. Demo text files have no real pagination. */
export function chunkText(text: string, charsPerPage = CHARS_PER_PAGE): FilePage[] {
  const normalised = text.replace(/\r\n/g, "\n").trim();
  if (!normalised) return [];
  const chunks: FilePage[] = [];
  for (let offset = 0, page = 1; offset < normalised.length; offset += charsPerPage, page += 1) {
    const slice = normalised.slice(offset, offset + charsPerPage);
    if (slice.trim().length === 0) continue;
    chunks.push({ page, text: slice });
  }
  return chunks;
}

function isTextLike(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type.startsWith("text/") ||
    /\.(txt|md|markdown|csv|json|tsv|log|html)$/.test(name) ||
    file.type === "application/json"
  );
}

/**
 * Extracts what the browser can extract without a native parser.
 * PDFs and images are uploaded to Supabase Storage in live mode where the
 * `embed-file` function parses them; the demo is explicit about the limitation.
 */
export async function extractFile(file: File): Promise<ExtractedFile> {
  if (isTextLike(file)) {
    const text = await file.text();
    const chunks = chunkText(text);
    return {
      name: file.name,
      mime: file.type || "text/plain",
      size: file.size,
      pages: chunks.length,
      kind: "text",
      text,
      chunks,
    };
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isImage = file.type.startsWith("image/");

  return {
    name: file.name,
    mime: file.type || (isPdf ? "application/pdf" : "application/octet-stream"),
    size: file.size,
    pages: 0,
    kind: isPdf ? "pdf" : isImage ? "image" : "other",
    text: "",
    chunks: [],
    warning: isPdf
      ? "PDF text is extracted in the backend. In demo mode, paste the passage or upload a .txt/.md file to get page citations."
      : isImage
        ? "Images are read by the backend vision model. In demo mode, type the question you want answered."
        : "This file type cannot be read locally. Upload .txt or .md, or connect Supabase for PDF support.",
  };
}

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "are",
  "but",
  "not",
  "you",
  "all",
  "any",
  "can",
  "had",
  "her",
  "was",
  "one",
  "our",
  "out",
  "day",
  "get",
  "has",
  "him",
  "his",
  "how",
  "man",
  "new",
  "now",
  "old",
  "see",
  "two",
  "way",
  "who",
  "boy",
  "did",
  "its",
  "let",
  "put",
  "say",
  "she",
  "too",
  "use",
]);

function tokenise(value: string): string[] {
  return value
    .toLowerCase()
    .match(/[a-z0-9]{3,}/g)
    ?.filter((token) => !STOPWORDS.has(token)) ?? [];
}

/** Cheap lexical retrieval used for demo citations; live mode uses pgvector. */
export function selectChunks(
  chunks: FilePage[],
  query: string,
  limit = 4,
): FilePage[] {
  const queryTokens = new Set(tokenise(query));
  if (queryTokens.size === 0) return chunks.slice(0, limit);

  return chunks
    .map((chunk) => {
      const tokens = tokenise(chunk.text);
      const hits = tokens.filter((token) => queryTokens.has(token)).length;
      return { chunk, score: hits / Math.sqrt(tokens.length + 1) };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.chunk);
}

export function humanFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
