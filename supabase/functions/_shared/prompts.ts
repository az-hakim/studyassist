import type { chatRequestSchema, z } from "./schemas.ts";

type ChatRequest = z.infer<typeof chatRequestSchema>;

const LEVEL_GUIDES: Record<string, string> = {
  school: "The student is in school (ages 11-16).",
  high_school: "The student is in high school (ages 16-18).",
  undergraduate: "The student is an undergraduate.",
  postgraduate: "The student is a postgraduate.",
  self_taught: "The student learns independently.",
};

const STYLE_GUIDES: Record<string, string> = {
  concise: "Answer tightly. Prefer short paragraphs and bullets.",
  step_by_step: "Explain in ordered steps and show the reasoning before the result.",
  eli5: "Use plain language and everyday analogies; define every term you introduce.",
  exam_focused:
    "Answer as an exam coach: definition, method, common trap, then one practice question.",
};

export function chatSystemPrompt(input: {
  profile: ChatRequest["profile"];
  chunks: NonNullable<ChatRequest["chunks"]>;
  webContext: string;
}): string {
  const profile = input.profile;
  const lines = [
    "You are Aeva, a patient study tutor inside a study app.",
    profile ? LEVEL_GUIDES[profile.educationLevel] : "The student is at high-school level.",
    `Always answer in ${profile?.language ?? "English"}.`,
    profile ? STYLE_GUIDES[profile.explanationStyle] : STYLE_GUIDES.step_by_step,
    "Use Markdown with headings, short paragraphs and tables where useful. Use $...$ for inline math and $$...$$ for display math.",
    "Never invent facts. If unsure, say what you know and what should be checked.",
  ];

  if (input.chunks.length > 0) {
    lines.push(
      "Ground claims in the provided excerpts and cite the exact page using the marker [p. N]. Only cite pages that appear below.",
      "Excerpts:",
      ...input.chunks.map((chunk) => `--- ${chunk.fileName} · page ${chunk.page} ---\n${chunk.text}`),
    );
  }

  if (input.webContext) {
    lines.push(
      "Live web results are provided. Prefer them for current facts and mention the source domain inline.",
      input.webContext,
    );
  }

  return lines.join("\n\n");
}

export function quizPrompt(input: {
  topic: string;
  difficulty: string;
  count: number;
  types: string[];
  sourceText?: string;
}): string {
  return [
    `Create a ${input.difficulty} difficulty quiz with exactly ${input.count} questions about "${input.topic}".`,
    `Allowed types: ${input.types.join(", ")}.`,
    "Return JSON only with this shape:",
    `{"title":string,"topic":string,"difficulty":"${input.difficulty}","questions":[{"id":"q1","type":"single|multi|tf","prompt":string,"options":[{"id":"a","label":string}],"answer":["a"],"explanation":string}]}`,
    "Every answer id must exist in options. single/tf have exactly one answer, multi has at least two. Explanations teach the concept.",
    input.sourceText ? `Base questions strictly on:\n\n${input.sourceText.slice(0, 12_000)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function flashcardsPrompt(input: { topic: string; count: number; sourceText?: string }): string {
  return [
    `Create ${input.count} active-recall flashcards about "${input.topic}".`,
    'Return JSON only: {"topic":string,"cards":[{"id":"c1","front":string,"back":string}]}',
    "Front is one clear prompt. Back is a complete, compact answer (max 60 words).",
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
    `Build a revision plan for "${input.examName}" on ${input.examDate}.`,
    `Subjects: ${input.subjects.join(", ")}. Daily budget: ${input.dailyMinutes} minutes.`,
    input.classStream ? `Class/stream: ${input.classStream}.` : "",
    'Return JSON only: {"examName":string,"examDate":"YYYY-MM-DD","classStream":string,"subjects":[string],"dailyMinutes":number,"days":[{"id":"d1","date":"YYYY-MM-DD","topics":[{"id":"t1","name":string,"subject":string,"minutes":number}]}]}',
    "Never exceed dailyMinutes on a day. Finish the syllabus before the exam and cover every subject.",
    input.syllabusText ? `Syllabus:\n\n${input.syllabusText.slice(0, 10_000)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function lessonPrompt(input: { topic: string; subject: string }): string {
  return [
    `Write a self-contained study lesson on "${input.topic}" for ${input.subject}.`,
    'Return JSON only: {"title":string,"markdown":string}',
    "Sections in order: Why it matters, Core ideas, Worked examples, Things to remember, Common mistakes, Self-check.",
    "End with three self-check questions and an answer key.",
  ].join("\n\n");
}
