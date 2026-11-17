import { z } from "npm:zod@3.23.8";

import { requireUser } from "../_shared/auth.ts";
import { errorResponse, HttpError, json, preflight } from "../_shared/http.ts";
import { planPrompt } from "../_shared/prompts.ts";
import { planSchema } from "../_shared/schemas.ts";
import { assertWithinBudget, recordUsage } from "../_shared/usage.ts";
import { generateValidated, readJson } from "../_shared/validate.ts";

const requestSchema = z.object({
  examName: z.string().min(1).max(160),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  classStream: z.string().max(120).optional(),
  subjects: z.array(z.string().min(1).max(80)).min(1).max(12),
  dailyMinutes: z.number().int().min(15).max(720),
  syllabusText: z.string().max(20_000).optional(),
  validationError: z.string().max(2000).optional(),
});

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    const { userId } = await requireUser(req);
    await assertWithinBudget(userId);

    const parsed = requestSchema.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, "Invalid plan request");
    const input = parsed.data;

    const { data, tokens } = await generateValidated({
      schema: planSchema,
      system:
        "You are an exam planner. Reply with JSON only. Build a realistic, evenly distributed plan that never exceeds the daily minute budget.",
      prompt: planPrompt(input),
      maxTokens: 4000,
      validationError: input.validationError,
    });

    await recordUsage(userId, tokens);
    return json(data);
  } catch (error) {
    return errorResponse(error);
  }
});
