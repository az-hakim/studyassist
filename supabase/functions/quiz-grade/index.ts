import { z } from "npm:zod@3.23.8";

import { requireUser } from "../_shared/auth.ts";
import { errorResponse, HttpError, json, preflight } from "../_shared/http.ts";
import { feedbackForScore } from "../_shared/grading.ts";
import { readJson } from "../_shared/validate.ts";

const requestSchema = z.object({
  quizId: z.string().uuid().optional(),
  questions: z
    .array(
      z.object({
        id: z.string(),
        prompt: z.string(),
        type: z.enum(["single", "multi", "tf"]),
        options: z.array(z.object({ id: z.string(), label: z.string() })),
        answer: z.array(z.string()),
        explanation: z.string(),
      }),
    )
    .min(1)
    .max(30),
  answers: z.record(z.array(z.string())),
});

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    const { userId, client } = await requireUser(req);
    const parsed = requestSchema.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, "Invalid grade request");
    const { questions, answers, quizId } = parsed.data;

    const results = questions.map((question) => {
      const given = [...(answers[question.id] ?? [])].sort();
      const expected = [...question.answer].sort();
      const correct =
        given.length === expected.length && given.every((value, index) => value === expected[index]);
      return {
        questionId: question.id,
        correct,
        expected,
        given,
        explanation: question.explanation,
      };
    });

    const correctCount = results.filter((result) => result.correct).length;
    const scorePct = Math.round((correctCount / questions.length) * 100);
    const feedback = feedbackForScore(scorePct);

    if (quizId) {
      await client.from("quiz_attempts").insert({
        user_id: userId,
        quiz_id: quizId,
        answers,
        score_pct: scorePct,
        feedback,
      });
    }

    return json({ scorePct, correctCount, total: questions.length, results, feedback });
  } catch (error) {
    return errorResponse(error);
  }
});
