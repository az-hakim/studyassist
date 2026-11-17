import { z } from "npm:zod@3.23.8";

import { requireUser } from "../_shared/auth.ts";
import { errorResponse, HttpError, json, preflight } from "../_shared/http.ts";
import { flashcardsPrompt } from "../_shared/prompts.ts";
import { deckSchema } from "../_shared/schemas.ts";
import { assertWithinBudget, recordUsage } from "../_shared/usage.ts";
import { generateValidated, readJson } from "../_shared/validate.ts";

const requestSchema = z.object({
  topic: z.string().min(2).max(200),
  count: z.number().int().min(1).max(30).default(8),
  sourceText: z.string().max(20_000).optional(),
  validationError: z.string().max(2000).optional(),
});

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    const { userId } = await requireUser(req);
    await assertWithinBudget(userId);

    const parsed = requestSchema.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, "Invalid flashcard request");
    const input = parsed.data;

    const { data, tokens } = await generateValidated({
      schema: deckSchema,
      system:
        "You write active-recall flashcards for students. Reply with JSON only. Each back must be a complete, checkable answer.",
      prompt: flashcardsPrompt(input),
      validationError: input.validationError,
    });

    await recordUsage(userId, tokens);
    return json(data);
  } catch (error) {
    return errorResponse(error);
  }
});
