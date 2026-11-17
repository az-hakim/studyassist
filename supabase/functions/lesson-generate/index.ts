import { z } from "npm:zod@3.23.8";

import { requireUser } from "../_shared/auth.ts";
import { errorResponse, HttpError, json, preflight } from "../_shared/http.ts";
import { lessonPrompt } from "../_shared/prompts.ts";
import { lessonSchema } from "../_shared/schemas.ts";
import { assertWithinBudget, recordUsage } from "../_shared/usage.ts";
import { generateValidated, readJson } from "../_shared/validate.ts";

const requestSchema = z.object({
  topic: z.string().min(2).max(200),
  subject: z.string().min(1).max(120),
  validationError: z.string().max(2000).optional(),
});

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    const { userId } = await requireUser(req);
    await assertWithinBudget(userId);

    const parsed = requestSchema.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, "Invalid lesson request");
    const input = parsed.data;

    const { data, tokens } = await generateValidated({
      schema: lessonSchema,
      system:
        "You write focused study lessons. Reply with JSON only. Use the required sections in order and keep claims accurate.",
      prompt: lessonPrompt(input),
      maxTokens: 3000,
      validationError: input.validationError,
    });

    await recordUsage(userId, tokens);
    return json(data);
  } catch (error) {
    return errorResponse(error);
  }
});
