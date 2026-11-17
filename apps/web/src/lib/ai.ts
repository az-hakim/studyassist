import type { LearningProfile } from "@studybuddy/shared";

import { supabase, functionUrl } from "./supabase";

export type ChatRole = "user" | "assistant";

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export interface ChatSource {
  title: string;
  url: string;
  domain: string;
}

export interface Citation {
  fileName: string;
  page: number;
  text: string;
}

export interface CitationChunk {
  fileName: string;
  page: number;
  text: string;
}

export type ChatMode = "live" | "demo";

export interface StreamResult {
  content: string;
  sources: ChatSource[];
  citations: Citation[];
  mode: ChatMode;
}

export class RequestAbortedError extends Error {
  constructor() {
    super("Request aborted");
    this.name = "RequestAbortedError";
  }
}

const DEMO_DELAY_MS = 12;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new RequestAbortedError());
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new RequestAbortedError());
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function extractTopic(question: string): string {
  const cleaned = question
    .replace(/^(please\s+)?(can you\s+)?(explain|describe|tell me about|what is|what are|define)\s+/i, "")
    .replace(/[?.!]+$/g, "")
    .trim();
  if (!cleaned) return "this topic";
  const words = cleaned.split(/\s+/).slice(0, 9).join(" ");
  return words.length > 70 ? `${words.slice(0, 67)}…` : words;
}

function demoAnswer(question: string, profile: LearningProfile, chunks: CitationChunk[]): string {
  const topic = extractTopic(question);
  const mathy = /equation|derivative|integral|algebra|probability|geometry|calculus|solve|matrix/i.test(
    question,
  );
  const comparative = /difference|versus|\bvs\b|compare/i.test(question);
  const styleLine =
    profile.explanationStyle === "exam_focused"
      ? "Structure this as: definition → method → exam trap → practice."
      : profile.explanationStyle === "eli5"
        ? "Think of it as a tool you reach for when a problem has a familiar shape."
        : profile.explanationStyle === "step_by_step"
          ? "Work through it in order, one decision at a time."
          : "Keep it tight: definition, mechanism, one example.";

  const lines: string[] = [];
  lines.push(`### Short answer`);
  lines.push(
    `${topic.charAt(0).toUpperCase()}${topic.slice(1)} is best understood by what it lets you do: name the idea precisely, then show where it applies. ${
      comparative
        ? "When comparing two things, contrast them on the same three axes — definition, mechanism and when each is used."
        : styleLine
    }`,
  );
  lines.push("");
  lines.push(`### Key ideas`);
  lines.push(`- **Definition.** Write one sentence that states what ${topic} is and what it is not.`);
  lines.push(
    `- **Mechanism.** Ask what changes, what stays fixed, and which rule licenses the step.`,
  );
  lines.push(
    `- **Boundary.** Note the conditions where ${topic} stops being valid — that is where exam questions usually hide the difficulty.`,
  );
  lines.push("");
  lines.push(`### Worked example`);
  if (mathy) {
    lines.push(
      "Take $f(x) = x^2 + 3x$. Differentiate term by term using the power rule: $$f'(x) = 2x + 3$$",
    );
    lines.push(
      "Then evaluate at $x = 1$: $f'(1) = 5$. The step most often lost is the constant term: it differentiates to zero, not to one.",
    );
  } else {
    lines.push(
      `1. Restate the question in your own words, naming ${topic}.`,
    );
    lines.push(`2. List the two facts you are certain about and the one you need to check.`);
    lines.push(
      `3. Apply the rule once, slowly, then verify the result against a simpler case.`,
    );
    lines.push(
      `4. Explain the result to an imaginary classmate in 30 seconds; the sentence you stumble on is your revision target.`,
    );
  }
  lines.push("");
  lines.push(`### Exam tip`);
  lines.push(
    `Use command words deliberately: *define* wants a precise sentence, *explain* wants a causal chain, *compare* wants paired points. For ${topic}, show the method even when the final number is wrong — method marks are usually the majority.`,
  );

  if (chunks.length > 0) {
    lines.push("");
    lines.push(`### From your file`);
    for (const chunk of chunks.slice(0, 2)) {
      const snippet = chunk.text.replace(/\s+/g, " ").slice(0, 220);
      lines.push(`> ${snippet} [p. ${chunk.page}]`);
    }
    lines.push("");
    lines.push(
      `Those excerpts come from **${chunks[0]?.fileName ?? "your upload"}**. Cite the page number when you reuse them in an answer.`,
    );
  }

  lines.push("");
  lines.push(`### Check yourself`);
  lines.push(`1. Explain ${topic} without using the word itself.`);
  lines.push(`2. Give one case where it applies and one where it fails.`);

  return lines.join("\n");
}

function demoSources(topic: string): ChatSource[] {
  const slug = encodeURIComponent(topic);
  return [
    {
      title: `${topic} — Wikipedia`,
      url: `https://en.wikipedia.org/w/index.php?search=${slug}`,
      domain: "en.wikipedia.org",
    },
    {
      title: `Khan Academy: ${topic}`,
      url: `https://www.khanacademy.org/search?page_search_query=${slug}`,
      domain: "khanacademy.org",
    },
    {
      title: `OpenStax: ${topic}`,
      url: `https://openstax.org/search?q=${slug}`,
      domain: "openstax.org",
    },
  ];
}

function citationsFrom(content: string, chunks: CitationChunk[]): Citation[] {
  const pages = Array.from(content.matchAll(/\[p\.\s*(\d+)\]/g))
    .map((match) => Number(match[1]))
    .filter((page) => Number.isFinite(page));
  const unique = Array.from(new Set(pages));
  return unique
    .map((page) => {
      const chunk = chunks.find((item) => item.page === page);
      return chunk ? { fileName: chunk.fileName, page: chunk.page, text: chunk.text } : null;
    })
    .filter((citation): citation is Citation => citation !== null);
}

function chunkForStreaming(text: string): string[] {
  const pieces: string[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const size = 14 + Math.floor(Math.random() * 18);
    pieces.push(text.slice(cursor, cursor + size));
    cursor += size;
  }
  return pieces;
}

export interface StreamTutorOptions {
  messages: ChatTurn[];
  profile: LearningProfile;
  webSearch: boolean;
  chunks?: CitationChunk[];
  topic?: string;
  signal?: AbortSignal;
  onToken?: (token: string) => void;
}

/**
 * Streams a tutor reply. With Supabase configured it consumes the `chat` Edge
 * Function's SSE stream; otherwise it streams a local structured answer so the
 * demo is fully usable. Either way the caller receives one assembled string.
 */
export async function streamTutorReply(options: StreamTutorOptions): Promise<StreamResult> {
  const { messages, profile, webSearch, chunks = [], signal, onToken } = options;
  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  const question = lastUser?.content ?? "this topic";

  if (supabase) {
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      const response = await fetch(functionUrl("chat"), {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          messages,
          webSearch,
          topic: options.topic,
          chunks,
          profile,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Chat function returned ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let content = "";
      let sources: ChatSource[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const event of events) {
          const dataLine = event
            .split("\n")
            .find((line) => line.startsWith("data:"));
          if (!dataLine) continue;
          const payload = dataLine.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload) as {
              type?: string;
              value?: string;
              sources?: ChatSource[];
              error?: string;
            };
            if (parsed.type === "token" && parsed.value) {
              content += parsed.value;
              onToken?.(parsed.value);
            } else if (parsed.type === "sources" && parsed.sources) {
              sources = parsed.sources;
            } else if (parsed.type === "error") {
              throw new Error(parsed.error ?? "Chat stream failed");
            }
          } catch (error) {
            if (error instanceof SyntaxError) continue;
            throw error;
          }
        }
      }

      if (content.trim().length === 0) throw new Error("Empty reply from the tutor");

      return {
        content,
        sources,
        citations: citationsFrom(content, chunks),
        mode: "live",
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new RequestAbortedError();
      }
      if (signal?.aborted) throw new RequestAbortedError();
      // Fall through to the local tutor rather than leaving the UI empty.
    }
  }

  const topic = options.topic?.trim() || extractTopic(question);
  const answer = demoAnswer(question, profile, chunks);

  for (const piece of chunkForStreaming(answer)) {
    if (signal?.aborted) throw new RequestAbortedError();
    onToken?.(piece);
    await sleep(DEMO_DELAY_MS, signal);
  }

  return {
    content: answer,
    sources: webSearch ? demoSources(topic) : [],
    citations: citationsFrom(answer, chunks),
    mode: "demo",
  };
}

/** Short scoped answer for a planner topic's doubt box. */
export async function askScopedDoubt(input: {
  question: string;
  topicName: string;
  subject: string;
  profile: LearningProfile;
  signal?: AbortSignal;
  onToken?: (token: string) => void;
}): Promise<string> {
  const result = await streamTutorReply({
    messages: [{ role: "user", content: input.question }],
    profile: input.profile,
    webSearch: false,
    topic: `${input.topicName} (${input.subject})`,
    signal: input.signal,
    onToken: input.onToken,
  });
  return result.content;
}
