import { z } from "npm:zod@3.23.8";

/**
 * Deno-safe mirror of packages/shared schemas. Supabase bundles each function
 * with its own module graph, so importing across the pnpm workspace is fragile.
 */

export const quizQuestionSchema = z
  .object({
    id: z.string().min(1).max(40),
    type: z.enum(["single", "multi", "tf"]),
    prompt: z.string().min(3).max(1200),
    options: z
      .array(z.object({ id: z.string().min(1).max(40), label: z.string().min(1).max(400) }))
      .min(2)
      .max(6),
    answer: z.array(z.string().min(1)).min(1),
    explanation: z.string().min(1).max(1500),
  })
  .superRefine((question, ctx) => {
    const ids = new Set(question.options.map((option) => option.id));
    for (const answer of question.answer) {
      if (!ids.has(answer)) ctx.addIssue({ code: "custom", message: `Unknown option id ${answer}` });
    }
    if ((question.type === "single" || question.type === "tf") && question.answer.length !== 1) {
      ctx.addIssue({ code: "custom", message: "Exactly one answer required" });
    }
    if (question.type === "multi" && question.answer.length < 2) {
      ctx.addIssue({ code: "custom", message: "At least two answers required" });
    }
  });

export const quizSchema = z.object({
  title: z.string().min(1).max(200),
  topic: z.string().min(1).max(200),
  difficulty: z.enum(["easy", "medium", "hard"]),
  questions: z.array(quizQuestionSchema).min(1).max(30),
});

export const deckSchema = z.object({
  topic: z.string().min(1).max(200),
  cards: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        front: z.string().min(1).max(600),
        back: z.string().min(1).max(1500),
      }),
    )
    .min(1)
    .max(60),
});

export const planSchema = z.object({
  examName: z.string().min(1).max(160),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  classStream: z.string().max(120).optional(),
  subjects: z.array(z.string().min(1).max(80)).min(1).max(12),
  dailyMinutes: z.number().int().min(15).max(720),
  days: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        topics: z
          .array(
            z.object({
              id: z.string().min(1).max(60),
              name: z.string().min(1).max(200),
              subject: z.string().min(1).max(120),
              minutes: z.number().int().min(5).max(240),
            }),
          )
          .min(1)
          .max(8),
      }),
    )
    .min(1)
    .max(60),
});

export const lessonSchema = z.object({
  title: z.string().min(1).max(200),
  markdown: z.string().min(20).max(40_000),
});

export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(24_000),
      }),
    )
    .min(1)
    .max(40),
  topic: z.string().max(200).optional(),
  webSearch: z.boolean().optional(),
  chunks: z
    .array(
      z.object({
        fileName: z.string().max(300),
        page: z.number().int().min(1).max(10_000),
        text: z.string().max(12_000),
      }),
    )
    .max(8)
    .optional(),
  profile: z
    .object({
      displayName: z.string().max(80).optional(),
      educationLevel: z.enum([
        "school",
        "high_school",
        "undergraduate",
        "postgraduate",
        "self_taught",
      ]),
      language: z.string().min(2).max(60),
      explanationStyle: z.enum(["concise", "step_by_step", "eli5", "exam_focused"]),
    })
    .optional(),
});

export function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? raw.trim();
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.search(/[[{]/);
    const end = Math.max(candidate.lastIndexOf("}"), candidate.lastIndexOf("]"));
    if (start >= 0 && end > start) return JSON.parse(candidate.slice(start, end + 1));
    throw new Error("Model reply did not contain JSON");
  }
}
