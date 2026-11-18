import type { Difficulty, LearningProfile } from "../schemas";

/** Prompt templates shared by the web app and Edge Functions. */

const STYLE_GUIDES: Record<LearningProfile["explanationStyle"], string> = {
  concise: "Answer tightly. Prefer short paragraphs and bullet points.",
  step_by_step:
    "Explain in ordered steps. Show the reasoning before the final answer and number the steps.",
  eli5: "Use plain language and everyday analogies. Avoid jargon unless you define it in context.",
  exam_focused:
    "Answer as an exam coach: definitions, marks-style structure, common traps and one practice question.",
};

const LEVEL_GUIDES: Record<LearningProfile["educationLevel"], string> = {
  school: "The student is in school (ages 11-16).",
  high_school: "The student is in high school (ages 16-18).",
  undergraduate: "The student is an undergraduate.",
  postgraduate: "The student is a postgraduate.",
  self_taught: "The student learns independently outside a formal course.",
};

export function buildSystemPrompt(
  profile: LearningProfile,
  options: { citations?: boolean; webSearch?: boolean } = {},
): string {
  const lines = [
    "You are Aeva, a patient study tutor inside a study app.",
    LEVEL_GUIDES[profile.educationLevel],
    `Always answer in ${profile.language}.`,
    STYLE_GUIDES[profile.explanationStyle],
    "Use Markdown with headings, short paragraphs, tables where useful and fenced code blocks for code.",
    "Use $...$ for inline math and $$...$$ for display math.",
    "Never invent facts. If you are unsure, say what you do know and what to check.",
  ];

  if (options.citations) {
    lines.push(
      "Cite retrieved source material with the exact page marker format [p. N]. Only cite pages that appear in the provided excerpts.",
    );
  }
  if (options.webSearch) {
    lines.push("When web results are supplied, prefer them for current facts and link them inline.");
  }

  return lines.join("\n");
}

export function quizPrompt(input: {
  topic: string;
  difficulty: Difficulty;
  count: number;
  types: Array<"single" | "multi" | "tf">;
  sourceText?: string;
}): string {
  return [
    `Create a ${input.difficulty} difficulty quiz with exactly ${input.count} questions about "${input.topic}".`,
    `Allowed question types: ${input.types.join(", ")}.`,
    "Return JSON only, matching this shape:",
    `{
  "title": string,
  "topic": string,
  "difficulty": "${input.difficulty}",
  "questions": [{
    "id": "q1",
    "type": "single" | "multi" | "tf",
    "prompt": string,
    "options": [{ "id": "a", "label": string }],
    "answer": ["a"],
    "explanation": string
  }]
}`,
    "Rules: every answer id must exist in options; single and tf questions have exactly one answer; multi questions have at least two; explanations teach the concept, not just the letter.",
    input.sourceText
      ? `Base the questions strictly on this material:\n\n${input.sourceText.slice(0, 12_000)}`
      : "Base the questions on standard curriculum content for the topic.",
  ].join("\n\n");
}

export function flashcardsPrompt(input: { topic: string; count: number; sourceText?: string }): string {
  return [
    `Create ${input.count} flashcards about "${input.topic}" for active recall.`,
    "Return JSON only:",
    `{ "topic": string, "cards": [{ "id": "c1", "front": string, "back": string }] }`,
    "Each front is one clear question or prompt. Each back is a complete but compact answer (max 60 words).",
    input.sourceText ? `Use this material:\n\n${input.sourceText.slice(0, 12_000)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function planPrompt(input: {
  examName: string;
  examDate: string;
  classStream?: string;
  subjects: string[];
  dailyMinutes: number;
  syllabusText?: string;
}): string {
  return [
    `Build a day-by-day revision plan for "${input.examName}" on ${input.examDate}.`,
    `Subjects: ${input.subjects.join(", ")}. Daily study budget: ${input.dailyMinutes} minutes.`,
    input.classStream ? `Class or stream: ${input.classStream}.` : "",
    "Return JSON only:",
    `{
  "examName": string,
  "examDate": "YYYY-MM-DD",
  "classStream": string,
  "subjects": [string],
  "dailyMinutes": number,
  "days": [{ "id": "d1", "date": "YYYY-MM-DD", "topics": [{ "id": "t1", "name": string, "subject": string, "minutes": number }] }]
}`,
    "Do not exceed dailyMinutes on any day. Distribute every subject across the plan and finish the syllabus before the exam date.",
    input.syllabusText ? `Syllabus:\n\n${input.syllabusText.slice(0, 10_000)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function lessonPrompt(input: { topic: string; subject: string }): string {
  return [
    `Write a self-contained study lesson on "${input.topic}" for ${input.subject}.`,
    "Return JSON only: { \"title\": string, \"markdown\": string }.",
    "The markdown must use these sections in order: Why it matters, Core ideas, Worked examples, Things to remember, Common mistakes, Self-check.",
    "End the Self-check with three questions and a short answer key.",
  ].join("\n\n");
}
