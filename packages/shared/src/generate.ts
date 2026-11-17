import {
  deckSchema,
  examPlanSchema,
  lessonSchema,
  quizQuestionSchema,
  quizSchema,
  type Deck,
  type Difficulty,
  type ExamPlan,
  type Lesson,
  type Quiz,
  type QuizQuestion,
  type QuizQuestionType,
} from "./schemas";

/**
 * Deterministic local generators.
 *
 * They power the offline demo mode of the web app and act as a safe fallback
 * when the Edge Functions (and therefore a model) are not configured. The
 * output is schema-valid and extractive where source material exists.
 */

const STOPWORDS = new Set([
  "about",
  "above",
  "after",
  "again",
  "against",
  "because",
  "before",
  "being",
  "between",
  "could",
  "during",
  "every",
  "first",
  "found",
  "their",
  "there",
  "these",
  "thing",
  "those",
  "through",
  "under",
  "using",
  "which",
  "while",
  "where",
  "would",
  "other",
  "should",
  "often",
  "usually",
  "called",
  "known",
  "makes",
  "means",
  "using",
  "form",
  "forms",
  "into",
  "from",
  "with",
  "that",
  "this",
  "have",
  "will",
  "they",
  "them",
  "then",
  "than",
  "when",
  "what",
  "your",
  "more",
  "most",
  "such",
  "also",
  "only",
  "some",
  "many",
  "much",
  "very",
  "each",
  "does",
]);

export function normaliseTopic(topic: string): string {
  return topic.trim().replace(/\s+/g, " ");
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function keyTerm(sentence: string): string | null {
  const words = sentence.match(/[A-Za-z][A-Za-z'-]{4,}/g);
  if (!words) return null;
  const candidates = words.filter((word) => !STOPWORDS.has(word.toLowerCase()));
  if (candidates.length === 0) return null;
  return candidates.reduce((longest, word) => (word.length > longest.length ? word : longest));
}

function shuffle<T>(items: readonly T[], seed: number): T[] {
  const result = [...items];
  let state = seed || 1;
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (state * 1103515245 + 12345) % 2147483648;
    const swap = state % (index + 1);
    const current = result[index];
    const other = result[swap];
    if (current !== undefined && other !== undefined) {
      result[index] = other;
      result[swap] = current;
    }
  }
  return result;
}

interface ExtractedFact {
  sentence: string;
  term: string;
}

function extractFacts(text: string): ExtractedFact[] {
  const facts: ExtractedFact[] = [];
  for (const sentence of splitSentences(text)) {
    if (sentence.length < 30 || sentence.length > 320) continue;
    const term = keyTerm(sentence);
    if (!term) continue;
    facts.push({ sentence, term });
  }
  return facts;
}

const OPTION_LABELS = ["a", "b", "c", "d"] as const;

function blankOut(sentence: string, term: string): string {
  const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return sentence.replace(pattern, "_____");
}

function buildSingleFromFact(fact: ExtractedFact, distractors: string[], index: number): QuizQuestion {
  const choices = shuffle([fact.term, ...distractors].slice(0, 4), index + 7);
  const options = choices.map((label, optionIndex) => ({
    id: OPTION_LABELS[optionIndex] ?? `o${optionIndex}`,
    label,
  }));
  const answer = options.find((option) => option.label === fact.term);
  return {
    id: `q${index + 1}`,
    type: "single",
    prompt: `Complete the statement: “${blankOut(fact.sentence, fact.term)}”`,
    options,
    answer: [answer?.id ?? options[0]?.id ?? "a"],
    explanation: `The missing term is “${fact.term}”. Source: “${fact.sentence}”`,
  };
}

function buildTrueFalseFromFact(fact: ExtractedFact, otherTerm: string | null, index: number): QuizQuestion {
  const makeFalse = index % 2 === 1 && Boolean(otherTerm);
  const statement = makeFalse && otherTerm ? blankOut(fact.sentence, fact.term).replace("_____", otherTerm) : fact.sentence;
  return {
    id: `q${index + 1}`,
    type: "tf",
    prompt: `True or false: “${statement}”`,
    options: [
      { id: "true", label: "True" },
      { id: "false", label: "False" },
    ],
    answer: [makeFalse ? "false" : "true"],
    explanation: makeFalse
      ? `False. Your material says: “${fact.sentence}”`
      : "True. This statement comes directly from your material.",
  };
}

interface Frame {
  prompt: string;
  options: string[];
  answer: string[];
  explanation: string;
  type: QuizQuestionType;
}

function studyFrames(topic: string, difficulty: Difficulty): Frame[] {
  const depth =
    difficulty === "easy"
      ? "at a recall level"
      : difficulty === "hard"
        ? "at an application level"
        : "at a understanding level";

  return [
    {
      type: "single",
      prompt: `You are revising “${topic}”. Which action gives the strongest evidence that you ${depth} understand it?`,
      options: [
        "Explaining it from memory and then checking against your notes",
        "Re-reading the chapter twice",
        "Highlighting every definition",
        "Watching a video at 2x speed",
      ],
      answer: ["a"],
      explanation:
        "Retrieval practice followed by feedback is the most reliable signal of understanding. Re-reading and highlighting feel productive but test recognition, not recall.",
    },
    {
      type: "single",
      prompt: `Which revision schedule best supports long-term retention of “${topic}”?`,
      options: [
        "Short sessions spread across several days",
        "One long session the night before the exam",
        "Only revising when you feel motivated",
        "Reading the summary once",
      ],
      answer: ["a"],
      explanation:
        "Spacing study sessions forces your memory to reconstruct the material, which is exactly how the spaced-repetition engine schedules this topic.",
    },
    {
      type: "tf",
      prompt: `True or false: If you can recognise a term from “${topic}”, you can usually apply it in a new problem.`,
      options: ["True", "False"],
      answer: ["false"],
      explanation:
        "Recognition is weaker than application. Test yourself with unseen problems, not just familiar definitions.",
    },
    {
      type: "tf",
      prompt: `True or false: Explaining “${topic}” out loud in your own words is a useful way to find gaps.`,
      options: ["True", "False"],
      answer: ["true"],
      explanation:
        "Teaching or explaining forces you to sequence ideas and exposes the parts you cannot yet justify.",
    },
    {
      type: "multi",
      prompt: `Which of these are good next steps after a weak quiz on “${topic}”?`,
      options: [
        "Review the explanations for the questions you missed",
        "Re-test yourself in a few days",
        "Ignore it because one quiz is not a trend",
        "Try a harder problem with the same concept",
      ],
      answer: ["a", "b", "d"],
      explanation:
        "Feedback, spaced re-testing and transfer to a harder problem all target the weak area. Ignoring the result removes your chance to correct it.",
    },
  ];
}

function frameToQuestion(frame: Frame, index: number): QuizQuestion {
  const options =
    frame.type === "tf"
      ? [
          { id: "true", label: frame.options[0] ?? "True" },
          { id: "false", label: frame.options[1] ?? "False" },
        ]
      : frame.options.map((label, optionIndex) => ({
          id: OPTION_LABELS[optionIndex] ?? `o${optionIndex}`,
          label,
        }));
  return {
    id: `q${index + 1}`,
    type: frame.type,
    prompt: frame.prompt,
    options,
    answer: frame.answer,
    explanation: frame.explanation,
  };
}

export function generateLocalQuiz(input: {
  topic: string;
  sourceText?: string;
  count?: number;
  difficulty?: Difficulty;
  types?: QuizQuestionType[];
}): Quiz {
  const topic = normaliseTopic(input.topic);
  const count = Math.min(20, Math.max(1, input.count ?? 5));
  const difficulty = input.difficulty ?? "medium";
  const types = input.types?.length ? input.types : (["single", "tf"] as QuizQuestionType[]);

  const facts = input.sourceText ? extractFacts(input.sourceText) : [];
  const questions: QuizQuestion[] = [];

  if (facts.length >= 4) {
    const terms = Array.from(new Set(facts.map((fact) => fact.term)));
    for (const [index, fact] of facts.entries()) {
      if (questions.length >= count) break;
      const distractors = terms.filter((term) => term !== fact.term).slice(0, 3);
      if (distractors.length < 3) continue;
      const type = types[index % types.length] ?? "single";
      if (type === "tf") {
        questions.push(buildTrueFalseFromFact(fact, distractors[0] ?? null, index));
      } else if (type === "multi") {
        // Extractively we only have one correct answer per fact, so use the
        // study frame for multi-select questions instead of faking it.
        continue;
      } else {
        questions.push(buildSingleFromFact(fact, distractors, index));
      }
    }
  }

  const frames = studyFrames(topic, difficulty);
  let frameIndex = 0;
  while (questions.length < count) {
    const allowed = frames.filter((frame) => types.includes(frame.type));
    const pool = allowed.length > 0 ? allowed : frames;
    const frame = pool[frameIndex % pool.length];
    if (!frame) break;
    questions.push(frameToQuestion(frame, questions.length));
    frameIndex += 1;
  }

  const validated = questions.slice(0, count).map((question, index) => {
    const parsed = quizQuestionSchema.safeParse({ ...question, id: `q${index + 1}` });
    if (!parsed.success) {
      throw new Error(`Local quiz generator produced an invalid question: ${parsed.error.message}`);
    }
    return parsed.data;
  });

  return quizSchema.parse({
    title: `${topic} — ${difficulty} quiz`,
    topic,
    difficulty,
    questions: validated,
  });
}

export function generateLocalFlashcards(input: {
  topic: string;
  sourceText?: string;
  count?: number;
}): Deck {
  const topic = normaliseTopic(input.topic);
  const count = Math.min(30, Math.max(3, input.count ?? 8));
  const facts = input.sourceText ? extractFacts(input.sourceText) : [];
  const cards: Deck["cards"] = [];

  for (const fact of facts) {
    if (cards.length >= count) break;
    cards.push({
      id: `c${cards.length + 1}`,
      front: `${fact.term}: what does your material say?`,
      back: fact.sentence,
    });
  }

  const prompts: Array<[string, string]> = [
    [
      `In one sentence, what is “${topic}”?`,
      "Write your own definition, then compare it with your notes. A good definition names the concept, what it does and where it applies.",
    ],
    [
      `Where does “${topic}” show up in an exam question?`,
      "Look for command words (define, explain, compare, calculate). Each one asks for a different structure, not just more words.",
    ],
    [
      `What is the most common mistake students make with “${topic}”?`,
      "Applying a memorised definition without checking the conditions where it holds. Always state assumptions before using a rule.",
    ],
    [
      `Give one worked example of “${topic}”.`,
      "Choose the simplest case, solve it fully, then change one variable and solve again. The contrast is what makes the method stick.",
    ],
    [
      `Which prerequisite ideas does “${topic}” depend on?`,
      "List the definitions and rules you needed in the last problem. Those are your prerequisites; revise them first if you got stuck.",
    ],
    [
      `How would you explain “${topic}” to a classmate in 60 seconds?`,
      "Use one definition, one example and one warning. If you cannot fit all three, you have found a gap to review.",
    ],
    [
      `What would a hard question about “${topic}” ask you to do?`,
      "Usually combine two ideas or transfer the method to a new context. Practise with unseen problems rather than similar ones.",
    ],
    [
      `How will you know you have mastered “${topic}”?`,
      "You can solve an unseen problem, explain the reasoning and spot an invalid shortcut, without notes.",
    ],
  ];

  let promptIndex = 0;
  while (cards.length < count) {
    const entry = prompts[promptIndex % prompts.length];
    if (!entry) break;
    cards.push({ id: `c${cards.length + 1}`, front: entry[0], back: entry[1] });
    promptIndex += 1;
  }

  return deckSchema.parse({ topic, cards: cards.slice(0, count) });
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

function defaultModules(subject: string): string[] {
  return [
    `${subject}: foundations`,
    `${subject}: core concepts`,
    `${subject}: worked practice`,
    `${subject}: past-paper drill`,
    `${subject}: review and self-test`,
  ];
}

export function generateLocalPlan(input: {
  examName: string;
  examDate: string;
  classStream?: string;
  subjects: string[];
  dailyMinutes: number;
  syllabusText?: string;
  now?: Date;
}): ExamPlan {
  const now = input.now ?? new Date();
  const examDate = new Date(`${input.examDate}T00:00:00.000Z`);
  if (Number.isNaN(examDate.getTime())) {
    throw new Error("Exam date must be a valid date");
  }

  const subjects = input.subjects.map(normaliseTopic).filter(Boolean);
  if (subjects.length === 0) throw new Error("Add at least one subject");

  const syllabusLines = (input.syllabusText ?? "")
    .split(/\n|;/)
    .map((line) => line.replace(/^[-*•\d.\s]+/, "").trim())
    .filter((line) => line.length > 2);

  const dailyMinutes = Math.min(720, Math.max(15, Math.round(input.dailyMinutes)));
  const slotsPerDay = Math.max(1, Math.floor(dailyMinutes / 45));
  const perTopicMinutes = Math.max(15, Math.min(90, Math.round(dailyMinutes / slotsPerDay)));

  const totalDays = Math.min(
    30,
    Math.max(1, Math.ceil((examDate.getTime() - now.getTime()) / 86_400_000) + 1),
  );

  const queue: Array<{ name: string; subject: string }> = [];
  for (const subject of subjects) {
    const fromSyllabus = syllabusLines.filter((line) =>
      line.toLowerCase().includes(subject.toLowerCase()),
    );
    const modules = fromSyllabus.length > 0 ? fromSyllabus : defaultModules(subject);
    for (const name of modules) queue.push({ name, subject });
  }

  const days: ExamPlan["days"] = [];
  let cursor = 0;
  // Round-robin so no subject is starved, repeating with a review suffix when
  // the syllabus runs out before the exam.
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex += 1) {
    const topics: ExamPlan["days"][number]["topics"] = [];
    for (let slot = 0; slot < slotsPerDay; slot += 1) {
      const entry = queue[cursor % queue.length];
      cursor += 1;
      if (!entry) break;
      const cycle = Math.floor((cursor - 1) / queue.length);
      const name = cycle === 0 ? entry.name : `${entry.name} (review ${cycle})`;
      topics.push({
        id: `t${dayIndex + 1}-${slot + 1}`,
        name,
        subject: entry.subject,
        minutes: perTopicMinutes,
      });
    }
    days.push({
      id: `d${dayIndex + 1}`,
      date: toIsoDate(addDays(now, dayIndex)),
      topics,
    });
  }

  return examPlanSchema.parse({
    examName: normaliseTopic(input.examName) || "Exam",
    examDate: input.examDate,
    classStream: input.classStream,
    subjects,
    dailyMinutes,
    days,
  });
}

export function generateLocalLesson(input: { topic: string; subject: string }): Lesson {
  const topic = normaliseTopic(input.topic);
  const subject = normaliseTopic(input.subject) || "your subject";

  const markdown = [
    `## Why it matters`,
    `“${topic}” appears in ${subject} questions that ask you to explain, compare or apply a rule. Getting it solid protects marks in both short answers and longer problems.`,
    ``,
    `## Core ideas`,
    `- **Definition.** Write the one-sentence definition of ${topic} in your own words before you revise anything else.`,
    `- **Purpose.** Know which problem ${topic} solves and the conditions under which it is valid.`,
    `- **Vocabulary.** List the three terms you must use precisely; vague language loses marks.`,
    `- **Connections.** Link ${topic} to the topic before and after it in your syllabus so recall has a path.`,
    ``,
    `## Worked examples`,
    `1. Start with the simplest possible case of ${topic} and solve it fully, writing every step.`,
    `2. Change exactly one variable and solve again. Note what stayed the same.`,
    `3. Now attempt an exam-style question with the notes closed. Compare your structure with the mark scheme.`,
    ``,
    `## Things to remember`,
    `- State assumptions before applying ${topic}.`,
    `- Show the reasoning, not only the result: method marks are usually larger than answer marks.`,
    `- Re-test this topic after 1 day, then 3 days, then a week.`,
    ``,
    `## Common mistakes`,
    `- Memorising the definition without practising application.`,
    `- Skipping the condition or units that make the rule valid.`,
    `- Practising only questions that look identical to the example.`,
    ``,
    `## Self-check`,
    `1. Define ${topic} in one sentence without notes.`,
    `2. Give one example where ${topic} applies and one where it does not.`,
    `3. Solve a problem that combines ${topic} with an earlier topic.`,
    ``,
    `_Answer key:_ check each answer against your class notes. If your definition misses a condition, that is your next revision target.`,
  ].join("\n");

  return lessonSchema.parse({ title: `${topic} — study lesson`, markdown });
}

export interface GradedQuestion {
  questionId: string;
  prompt: string;
  correct: boolean;
  expected: string[];
  given: string[];
  explanation: string;
}

export interface GradeResult {
  scorePct: number;
  correctCount: number;
  total: number;
  results: GradedQuestion[];
}

export function gradeQuiz(
  quiz: Pick<Quiz, "questions">,
  answers: Record<string, string[]>,
): GradeResult {
  const results = quiz.questions.map((question) => {
    const given = [...(answers[question.id] ?? [])].sort();
    const expected = [...question.answer].sort();
    const correct =
      given.length === expected.length && given.every((value, index) => value === expected[index]);
    return {
      questionId: question.id,
      prompt: question.prompt,
      correct,
      expected,
      given,
      explanation: question.explanation,
    };
  });

  const correctCount = results.filter((result) => result.correct).length;
  const total = results.length;
  const scorePct = total === 0 ? 0 : Math.round((correctCount / total) * 100);

  return { scorePct, correctCount, total, results };
}

export function feedbackForScore(scorePct: number): string {
  if (scorePct >= 90) {
    return "Excellent. You can recall this reliably — space the next review out and try a harder application question.";
  }
  if (scorePct >= 75) {
    return "Solid. The core is there; revisit the questions you missed and re-test in three days.";
  }
  if (scorePct >= 50) {
    return "Halfway. Read each explanation carefully, then rebuild the topic from a blank page before retrying.";
  }
  return "This topic needs a fresh pass. Start with the lesson, then retry a shorter quiz so you can see progress quickly.";
}
