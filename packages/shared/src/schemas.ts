import { z } from "zod";

/** Network-boundary schemas. Every AI response is validated with these. */

export const ratingSchema = z.enum(["easy", "medium", "hard", "needs_revision"]);

export const difficultySchema = z.enum(["easy", "medium", "hard"]);
export type Difficulty = z.infer<typeof difficultySchema>;

export const quizQuestionTypeSchema = z.enum(["single", "multi", "tf"]);
export type QuizQuestionType = z.infer<typeof quizQuestionTypeSchema>;

export const sourceSchema = z.object({
  title: z.string().min(1).max(300),
  url: z.string().url(),
  domain: z.string().min(1).max(120),
  favicon: z.string().url().optional(),
});
export type Source = z.infer<typeof sourceSchema>;

const optionSchema = z.object({
  id: z.string().min(1).max(40),
  label: z.string().min(1).max(400),
});

export const quizQuestionSchema = z
  .object({
    id: z.string().min(1).max(40),
    type: quizQuestionTypeSchema,
    prompt: z.string().min(3).max(1200),
    options: z.array(optionSchema).min(2).max(6),
    answer: z.array(z.string().min(1)).min(1),
    explanation: z.string().min(1).max(1500),
  })
  .superRefine((question, ctx) => {
    const ids = new Set(question.options.map((option) => option.id));
    if (ids.size !== question.options.length) {
      ctx.addIssue({ code: "custom", message: "Option ids must be unique" });
    }
    for (const answer of question.answer) {
      if (!ids.has(answer)) {
        ctx.addIssue({
          code: "custom",
          message: `Answer "${answer}" is not one of the option ids`,
        });
      }
    }
    if (question.type === "single" && question.answer.length !== 1) {
      ctx.addIssue({ code: "custom", message: "Single-choice questions need exactly one answer" });
    }
    if (question.type === "tf" && question.answer.length !== 1) {
      ctx.addIssue({ code: "custom", message: "True/false questions need exactly one answer" });
    }
    if (question.type === "multi" && question.answer.length < 2) {
      ctx.addIssue({ code: "custom", message: "Multi-select questions need at least two answers" });
    }
  });

export const quizSchema = z.object({
  title: z.string().min(1).max(200),
  topic: z.string().min(1).max(200),
  difficulty: difficultySchema,
  questions: z.array(quizQuestionSchema).min(1).max(30),
});
export type Quiz = z.infer<typeof quizSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

export const flashcardSchema = z.object({
  id: z.string().min(1).max(40),
  front: z.string().min(1).max(600),
  back: z.string().min(1).max(1500),
});
export type Flashcard = z.infer<typeof flashcardSchema>;

export const deckSchema = z.object({
  topic: z.string().min(1).max(200),
  cards: z.array(flashcardSchema).min(1).max(60),
});
export type Deck = z.infer<typeof deckSchema>;

export const planTopicSchema = z.object({
  id: z.string().min(1).max(60),
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(120),
  minutes: z.number().int().min(5).max(240),
});
export type PlanTopic = z.infer<typeof planTopicSchema>;

export const planDaySchema = z.object({
  id: z.string().min(1).max(60),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  topics: z.array(planTopicSchema).min(1).max(8),
});
export type PlanDay = z.infer<typeof planDaySchema>;

export const examPlanSchema = z.object({
  examName: z.string().min(1).max(160),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  classStream: z.string().max(120).optional(),
  subjects: z.array(z.string().min(1).max(80)).min(1).max(12),
  dailyMinutes: z.number().int().min(15).max(720),
  days: z.array(planDaySchema).min(1).max(60),
});
export type ExamPlan = z.infer<typeof examPlanSchema>;

export const lessonSchema = z.object({
  title: z.string().min(1).max(200),
  markdown: z.string().min(20).max(40_000),
});
export type Lesson = z.infer<typeof lessonSchema>;

export const educationLevelSchema = z.enum([
  "school",
  "high_school",
  "undergraduate",
  "postgraduate",
  "self_taught",
]);
export type EducationLevel = z.infer<typeof educationLevelSchema>;

export const explanationStyleSchema = z.enum([
  "concise",
  "step_by_step",
  "eli5",
  "exam_focused",
]);
export type ExplanationStyle = z.infer<typeof explanationStyleSchema>;

export const learningProfileSchema = z.object({
  displayName: z.string().min(1).max(80),
  educationLevel: educationLevelSchema,
  language: z.string().min(2).max(60),
  explanationStyle: explanationStyleSchema,
});
export type LearningProfile = z.infer<typeof learningProfileSchema>;

export const chatRoleSchema = z.enum(["user", "assistant", "system"]);
export const chatMessageSchema = z.object({
  role: chatRoleSchema,
  content: z.string().min(1).max(24_000),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(40),
  spaceId: z.string().uuid().nullish(),
  topic: z.string().max(200).optional(),
  webSearch: z.boolean().optional(),
  fileIds: z.array(z.string().uuid()).max(10).optional(),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

/** Extract JSON from an assistant reply, tolerating ```json fences and prose. */
export function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.search(/[[{]/);
    const end = Math.max(candidate.lastIndexOf("}"), candidate.lastIndexOf("]"));
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error("Model reply did not contain JSON");
  }
}

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function parseWithSchema<T>(schema: z.ZodType<T>, raw: string): ParseResult<T> {
  try {
    const parsed = schema.safeParse(extractJson(raw));
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues.map((issue) => issue.message).join("; ") };
    }
    return { ok: true, data: parsed.data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown parse error" };
  }
}
