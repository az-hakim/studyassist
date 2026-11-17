import {
  deckSchema,
  examPlanSchema,
  generateLocalFlashcards,
  generateLocalLesson,
  generateLocalPlan,
  generateLocalQuiz,
  lessonSchema,
  parseWithSchema,
  quizSchema,
  type Deck,
  type Difficulty,
  type ExamPlan,
  type Lesson,
  type Quiz,
  type QuizQuestionType,
} from "@studybuddy/shared";
import type { ZodType } from "zod";

import { supabase, functionUrl } from "./supabase";

export type GenerationMode = "live" | "demo";

export class AiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiUnavailableError";
  }
}

async function authHeader(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Calls an Edge Function, validates the JSON with Zod and retries once with the
 * validation error so the model can repair its own output.
 */
async function requestStructured<T>(
  name: string,
  body: Record<string, unknown>,
  schema: ZodType<T>,
): Promise<T> {
  if (!supabase) throw new AiUnavailableError("Supabase is not configured");

  let lastError = "Unknown validation error";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const headers = await authHeader();
    const response = await fetch(functionUrl(name), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(attempt === 0 ? body : { ...body, validationError: lastError }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new AiUnavailableError(
        detail.slice(0, 240) || `The ${name} function returned ${response.status}`,
      );
    }

    const raw = await response.text();
    const parsed = parseWithSchema(schema, raw);
    if (parsed.ok) return parsed.data;
    lastError = parsed.error;
  }

  throw new AiUnavailableError(`Nova could not produce a valid ${name} response. ${lastError}`);
}

export async function requestQuiz(input: {
  topic: string;
  difficulty: Difficulty;
  count: number;
  types: QuizQuestionType[];
  sourceText?: string;
}): Promise<{ quiz: Quiz; mode: GenerationMode }> {
  if (supabase) {
    try {
      const quiz = await requestStructured("quiz-generate", { ...input }, quizSchema);
      return { quiz, mode: "live" };
    } catch {
      // fall through to the deterministic generator
    }
  }
  return { quiz: generateLocalQuiz(input), mode: "demo" };
}

export async function requestDeck(input: {
  topic: string;
  count: number;
  sourceText?: string;
}): Promise<{ deck: Deck; mode: GenerationMode }> {
  if (supabase) {
    try {
      const deck = await requestStructured("flashcards-generate", { ...input }, deckSchema);
      return { deck, mode: "live" };
    } catch {
      // fall through
    }
  }
  return { deck: generateLocalFlashcards(input), mode: "demo" };
}

export async function requestPlan(input: {
  examName: string;
  examDate: string;
  classStream?: string;
  subjects: string[];
  dailyMinutes: number;
  syllabusText?: string;
}): Promise<{ plan: ExamPlan; mode: GenerationMode }> {
  if (supabase) {
    try {
      const plan = await requestStructured("plan-generate", { ...input }, examPlanSchema);
      return { plan, mode: "live" };
    } catch {
      // fall through
    }
  }
  return { plan: generateLocalPlan(input), mode: "demo" };
}

export async function requestLesson(input: {
  topic: string;
  subject: string;
}): Promise<{ lesson: Lesson; mode: GenerationMode }> {
  if (supabase) {
    try {
      const lesson = await requestStructured("lesson-generate", { ...input }, lessonSchema);
      return { lesson, mode: "live" };
    } catch {
      // fall through
    }
  }
  return { lesson: generateLocalLesson(input), mode: "demo" };
}

export const generationIsLive = Boolean(supabase);
