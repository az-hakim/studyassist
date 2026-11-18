import type { z } from "npm:zod@3.23.8";

import { callModel } from "./ai.ts";
import { HttpError } from "./http.ts";
import { extractJson } from "./schemas.ts";

/**
 * Requests JSON from the model, validates it, and retries exactly once with the
 * validation error so the model can repair its own output.
 */
export async function generateValidated<T>(input: {
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
  maxTokens?: number;
  validationError?: string;
}): Promise<{ data: T; tokens: number }> {
  let errorContext = input.validationError ?? "";
  let totalTokens = 0;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const prompt =
      attempt === 0 || !errorContext
        ? input.prompt
        : `${input.prompt}\n\nYour previous reply failed validation with: ${errorContext}. Return corrected JSON only.`;

    const result = await callModel({
      system: input.system,
      messages: [{ role: "user", content: prompt }],
      maxTokens: input.maxTokens ?? 1800,
      json: true,
    });
    totalTokens += result.tokens;

    try {
      const parsed = input.schema.safeParse(extractJson(result.text));
      if (parsed.success) return { data: parsed.data, tokens: totalTokens };
      errorContext = parsed.error.issues
        .slice(0, 5)
        .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
        .join("; ");
    } catch (error) {
      errorContext = error instanceof Error ? error.message : "Invalid JSON";
    }
  }

  throw new HttpError(502, "Aeva could not produce a valid result. Please try again.");
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "Expected a JSON body");
  }
}

export function badRequest(message: string): never {
  throw new HttpError(400, message);
}
