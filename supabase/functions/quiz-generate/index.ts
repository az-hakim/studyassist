import { z } from "npm:zod@3.23.8";

import { requireUser } from "../_shared/auth.ts";
import { errorResponse, HttpError, json, preflight } from "../_shared/http.ts";
import { quizPrompt } from "../_shared/prompts.ts";
import { quizSchema } from "../_shared/schemas.ts";
import { assertWithinBudget, recordUsage } from "../_shared/usage.ts";
import { generateValidated, readJson } from "../_shared/validate.ts";

const requestSchema = z.object({
  topic: z.string().min(2).max(200),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  count: z.number().int().min(1).max(20).default(5),
  types: z.array(z.enum(["single", "multi", "tf"])).min(1).default(["single", "tf"]),
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
    if (!parsed.success) throw new HttpError(400, "Invalid quiz request");
    const input = parsed.data;

    const { data, tokens } = await generateValidated({
      schema: quizSchema,
      system:
        "You write curriculum-accurate quiz questions. Reply with JSON only. Never invent option ids that do not exist.",
      prompt: quizPrompt(input),
      validationError: input.validationError,
    });

    await recordUsage(userId, tokens);
    return json(data);
  } catch (error) {
    return errorResponse(error);
  }
});
