import { HttpError } from "./http.ts";

export interface ModelMessage {
  role: "user" | "assistant";
  content: string;
}

interface CallOptions {
  system: string;
  messages: ModelMessage[];
  maxTokens?: number;
  json?: boolean;
}

interface StreamOptions extends CallOptions {
  onToken: (token: string) => void;
}

interface ModelResult {
  text: string;
  tokens: number;
}

function provider(): "anthropic" | "openai" {
  return Deno.env.get("AI_PROVIDER") === "openai" ? "openai" : "anthropic";
}

function apiKey(): string {
  const key = Deno.env.get("AI_API_KEY");
  if (!key) throw new HttpError(503, "The tutor is not configured yet. Add AI_API_KEY.");
  return key;
}

function modelName(): string {
  return (
    Deno.env.get("AI_MODEL") ??
    (provider() === "openai" ? "gpt-4o-mini" : "claude-3-5-sonnet-latest")
  );
}

/** Non-streaming completion. Used by structured generation functions. */
export async function callModel(options: CallOptions): Promise<ModelResult> {
  if (provider() === "openai") {
    const response = await fetch(
      `${Deno.env.get("AI_BASE_URL") ?? "https://api.openai.com/v1"}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName(),
          max_tokens: options.maxTokens ?? 1600,
          messages: [{ role: "system", content: options.system }, ...options.messages],
          ...(options.json ? { response_format: { type: "json_object" } } : {}),
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      throw new HttpError(response.status === 429 ? 429 : 502, `Model error: ${detail.slice(0, 200)}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { total_tokens?: number };
    };
    const text = payload.choices?.[0]?.message?.content ?? "";
    if (!text) throw new HttpError(502, "The model returned an empty answer");
    return { text, tokens: payload.usage?.total_tokens ?? 0 };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey(),
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelName(),
      max_tokens: options.maxTokens ?? 1600,
      system: options.system,
      messages: options.messages,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new HttpError(response.status === 429 ? 429 : 502, `Model error: ${detail.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const text = (payload.content ?? [])
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");
  if (!text) throw new HttpError(502, "The model returned an empty answer");
  return {
    text,
    tokens: (payload.usage?.input_tokens ?? 0) + (payload.usage?.output_tokens ?? 0),
  };
}

/** Streaming completion. Calls onToken for each text delta and returns the full text. */
export async function streamModel(options: StreamOptions): Promise<ModelResult> {
  if (provider() === "openai") {
    const response = await fetch(
      `${Deno.env.get("AI_BASE_URL") ?? "https://api.openai.com/v1"}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName(),
          max_tokens: options.maxTokens ?? 1200,
          stream: true,
          messages: [{ role: "system", content: options.system }, ...options.messages],
        }),
      },
    );

    if (!response.ok || !response.body) {
      const detail = await response.text();
      throw new HttpError(502, `Model error: ${detail.slice(0, 200)}`);
    }

    let text = "";
    await readSse(response.body, (payload) => {
      const parsed = JSON.parse(payload) as {
        choices?: Array<{ delta?: { content?: string } }>;
      };
      const delta = parsed.choices?.[0]?.delta?.content;
      if (delta) {
        text += delta;
        options.onToken(delta);
      }
    });
    return { text, tokens: Math.round(text.length / 4) };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey(),
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelName(),
      max_tokens: options.maxTokens ?? 1200,
      system: options.system,
      messages: options.messages,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text();
    throw new HttpError(502, `Model error: ${detail.slice(0, 200)}`);
  }

  let text = "";
  await readSse(response.body, (payload) => {
    const parsed = JSON.parse(payload) as {
      type?: string;
      delta?: { type?: string; text?: string };
      usage?: { output_tokens?: number };
    };
    if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
      const delta = parsed.delta.text ?? "";
      text += delta;
      options.onToken(delta);
    }
  });

  return { text, tokens: Math.round(text.length / 4) };
}

async function readSse(
  body: ReadableStream<Uint8Array>,
  onData: (payload: string) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const event of events) {
      for (const line of event.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          onData(payload);
        } catch {
          // Ignore malformed keep-alive frames.
        }
      }
    }
  }
}
