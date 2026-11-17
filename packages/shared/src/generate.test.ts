import { describe, expect, it } from "vitest";

import {
  generateLocalFlashcards,
  generateLocalLesson,
  generateLocalPlan,
  generateLocalQuiz,
  gradeQuiz,
} from "./generate";
import { deckSchema, examPlanSchema, extractJson, parseWithSchema, quizSchema } from "./schemas";

const SOURCE = `
Photosynthesis converts light energy into chemical energy stored in glucose. Chlorophyll absorbs light most strongly in the blue and red wavelengths. The light-dependent reactions take place in the thylakoid membranes of the chloroplast. The Calvin cycle fixes carbon dioxide using ATP and NADPH produced by the light reactions. Oxygen is released as a by-product when water molecules are split during photolysis. The rate of photosynthesis increases with light intensity until another factor becomes limiting.
`;

describe("generateLocalQuiz", () => {
  it("generates the requested number of valid questions", () => {
    const quiz = generateLocalQuiz({ topic: "Photosynthesis", sourceText: SOURCE, count: 5 });
    expect(quiz.questions).toHaveLength(5);
    expect(quizSchema.safeParse(quiz).success).toBe(true);
  });

  it("uses source material when enough facts exist", () => {
    const quiz = generateLocalQuiz({ topic: "Photosynthesis", sourceText: SOURCE, count: 4 });
    expect(quiz.questions.some((question) => question.prompt.includes("_____"))).toBe(true);
  });

  it("falls back to study frames without source text", () => {
    const quiz = generateLocalQuiz({ topic: "Linear algebra", count: 4, types: ["single", "tf"] });
    expect(quiz.questions).toHaveLength(4);
    expect(quiz.questions.every((question) => question.explanation.length > 10)).toBe(true);
  });

  it("only emits allowed question types", () => {
    const quiz = generateLocalQuiz({ topic: "Cells", count: 3, types: ["tf"] });
    expect(quiz.questions.every((question) => question.type === "tf")).toBe(true);
  });

  it("always references existing option ids in answers", () => {
    const quiz = generateLocalQuiz({ topic: "Cell biology", count: 6 });
    for (const question of quiz.questions) {
      const ids = new Set(question.options.map((option) => option.id));
      for (const answer of question.answer) expect(ids.has(answer)).toBe(true);
    }
  });

  it("clamps absurd question counts", () => {
    expect(generateLocalQuiz({ topic: "Physics", count: 999 }).questions.length).toBeLessThanOrEqual(20);
  });
});

describe("gradeQuiz", () => {
  const quiz = generateLocalQuiz({ topic: "Optics", count: 3 });

  it("scores a perfect attempt at 100", () => {
    const answers = Object.fromEntries(quiz.questions.map((question) => [question.id, question.answer]));
    const result = gradeQuiz(quiz, answers);
    expect(result.scorePct).toBe(100);
    expect(result.results.every((item) => item.correct)).toBe(true);
  });

  it("scores an empty attempt at 0", () => {
    const result = gradeQuiz(quiz, {});
    expect(result.scorePct).toBe(0);
    expect(result.correctCount).toBe(0);
  });

  it("rounds partial scores", () => {
    const [first] = quiz.questions;
    const answers = first ? { [first.id]: first.answer } : {};
    const result = gradeQuiz(quiz, answers);
    expect(result.scorePct).toBe(Math.round((1 / quiz.questions.length) * 100));
  });

  it("does not accept a superset of the correct answer", () => {
    const [first] = quiz.questions;
    if (!first) throw new Error("expected a question");
    const extra = first.options.find((option) => !first.answer.includes(option.id));
    const result = gradeQuiz(quiz, { [first.id]: [...first.answer, extra?.id ?? "x"] });
    expect(result.results[0]?.correct).toBe(false);
  });
});

describe("generateLocalFlashcards", () => {
  it("creates at least the minimum deck size", () => {
    const deck = generateLocalFlashcards({ topic: "Thermodynamics" });
    expect(deck.cards.length).toBeGreaterThanOrEqual(3);
  });

  it("uses source sentences when available", () => {
    const deck = generateLocalFlashcards({ topic: "Photosynthesis", sourceText: SOURCE, count: 4 });
    expect(deck.cards.length).toBe(4);
    expect(deck.cards.some((card) => card.back.includes("chlorophyll") || card.back.includes("Chlorophyll"))).toBe(true);
  });

  it("produces schema-valid decks", () => {
    const deck = generateLocalFlashcards({ topic: "Organic chemistry", count: 6 });
    expect(deckSchema.safeParse(deck).success).toBe(true);
  });
});

describe("generateLocalPlan", () => {
  const now = new Date("2026-01-01T08:00:00.000Z");

  it("covers every day until the exam", () => {
    const plan = generateLocalPlan({
      examName: "Midterms",
      examDate: "2026-01-06",
      subjects: ["Math", "Biology"],
      dailyMinutes: 90,
      now,
    });
    expect(plan.days).toHaveLength(6);
    expect(examPlanSchema.safeParse(plan).success).toBe(true);
    expect(plan.days[0]?.date).toBe("2026-01-01");
  });

  it("never exceeds the daily study budget", () => {
    const plan = generateLocalPlan({
      examName: "Finals",
      examDate: "2026-01-04",
      subjects: ["Math", "Biology", "History"],
      dailyMinutes: 120,
      now,
    });
    for (const day of plan.days) {
      const total = day.topics.reduce((sum, topic) => sum + topic.minutes, 0);
      expect(total).toBeLessThanOrEqual(120);
    }
  });

  it("includes topics for every subject", () => {
    const plan = generateLocalPlan({
      examName: "Finals",
      examDate: "2026-01-08",
      subjects: ["Math", "Biology"],
      dailyMinutes: 60,
      now,
    });
    const subjects = new Set(plan.days.flatMap((day) => day.topics.map((topic) => topic.subject)));
    expect(subjects.has("Math")).toBe(true);
    expect(subjects.has("Biology")).toBe(true);
  });

  it("rejects invalid input", () => {
    expect(() =>
      generateLocalPlan({ examName: "x", examDate: "not-a-date", subjects: ["Math"], dailyMinutes: 60, now }),
    ).toThrow();
    expect(() =>
      generateLocalPlan({ examName: "x", examDate: "2026-02-01", subjects: [], dailyMinutes: 60, now }),
    ).toThrow();
  });
});

describe("generateLocalLesson", () => {
  it("contains every required section", () => {
    const lesson = generateLocalLesson({ topic: "Cell division", subject: "Biology" });
    for (const heading of [
      "Why it matters",
      "Core ideas",
      "Worked examples",
      "Things to remember",
      "Common mistakes",
      "Self-check",
    ]) {
      expect(lesson.markdown).toContain(heading);
    }
  });
});

describe("JSON parsing helpers", () => {
  it("extracts JSON from fenced code", () => {
    expect(extractJson('Here you go:\n```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("extracts JSON from surrounding prose", () => {
    expect(extractJson('Sure! {"a":2} hope that helps')).toEqual({ a: 2 });
  });

  it("reports validation errors instead of throwing", () => {
    const result = parseWithSchema(quizSchema, '{"title":""}');
    expect(result.ok).toBe(false);
  });
});
