import { generateLocalPlan, type QuizQuestion } from "@studybuddy/shared";

import type { CardRecord, DeckRecord, MemoryRecord, Note, PlanRecord, QuizRecord, Space, StudySession } from "@/store/types";

function daysAgo(days: number, hour = 9): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
}

function inDays(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const biologySpace: Space = {
  id: "space_biology",
  name: "Biology",
  subject: "Biology",
  color: "emerald",
  createdAt: daysAgo(21),
  updatedAt: daysAgo(1),
};

const mathsSpace: Space = {
  id: "space_maths",
  name: "Mathematics",
  subject: "Mathematics",
  color: "indigo",
  createdAt: daysAgo(18),
  updatedAt: daysAgo(2),
};

const historySpace: Space = {
  id: "space_history",
  name: "World History",
  subject: "History",
  color: "amber",
  createdAt: daysAgo(12),
  updatedAt: daysAgo(4),
};

const seedQuestions: QuizQuestion[] = [
  {
    id: "q1",
    type: "single",
    prompt: "Which organelle is the main site of ATP production in eukaryotic cells?",
    options: [
      { id: "a", label: "Mitochondrion" },
      { id: "b", label: "Ribosome" },
      { id: "c", label: "Golgi apparatus" },
      { id: "d", label: "Lysosome" },
    ],
    answer: ["a"],
    explanation:
      "Oxidative phosphorylation happens on the inner mitochondrial membrane, where the electron transport chain builds the proton gradient used by ATP synthase.",
  },
  {
    id: "q2",
    type: "single",
    prompt: "During glycolysis, one molecule of glucose is converted into:",
    options: [
      { id: "a", label: "Two molecules of pyruvate" },
      { id: "b", label: "One molecule of acetyl-CoA" },
      { id: "c", label: "Two molecules of citrate" },
      { id: "d", label: "One molecule of glucose-6-phosphate" },
    ],
    answer: ["a"],
    explanation:
      "Glycolysis splits the six-carbon glucose into two three-carbon pyruvate molecules, producing a net gain of 2 ATP and 2 NADH.",
  },
  {
    id: "q3",
    type: "tf",
    prompt: "True or false: Oxygen is the final electron acceptor in the electron transport chain.",
    options: [
      { id: "true", label: "True" },
      { id: "false", label: "False" },
    ],
    answer: ["true"],
    explanation:
      "Oxygen accepts electrons at complex IV and combines with protons to form water, which is why the chain stops without oxygen.",
  },
  {
    id: "q4",
    type: "multi",
    prompt: "Which of these are produced during the Krebs cycle?",
    options: [
      { id: "a", label: "NADH" },
      { id: "b", label: "FADH₂" },
      { id: "c", label: "Glucose" },
      { id: "d", label: "Carbon dioxide" },
    ],
    answer: ["a", "b", "d"],
    explanation:
      "Each turn of the cycle releases CO₂ and reduces NAD⁺ and FAD. Glucose is broken down before the cycle, not produced by it.",
  },
  {
    id: "q5",
    type: "single",
    prompt: "Where does the Krebs cycle take place?",
    options: [
      { id: "a", label: "Mitochondrial matrix" },
      { id: "b", label: "Cytoplasm" },
      { id: "c", label: "Thylakoid membrane" },
      { id: "d", label: "Nucleus" },
    ],
    answer: ["a"],
    explanation:
      "The enzymes of the Krebs cycle are dissolved in the mitochondrial matrix, while the electron transport chain sits on the inner membrane.",
  },
];

const seedCards: CardRecord[] = [
  {
    id: "c1",
    front: "What is the overall equation for aerobic respiration?",
    back: "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy (about 30–32 ATP per glucose in eukaryotes).",
    rating: "medium",
  },
  {
    id: "c2",
    front: "Where does glycolysis happen?",
    back: "In the cytoplasm, before pyruvate enters the mitochondrion.",
  },
  {
    id: "c3",
    front: "What does the electron transport chain use oxygen for?",
    back: "Oxygen is the final electron acceptor; it forms water when it combines with electrons and protons.",
  },
  {
    id: "c4",
    front: "Net ATP yield of glycolysis?",
    back: "2 ATP net (4 produced, 2 used), plus 2 NADH.",
  },
  {
    id: "c5",
    front: "What is anaerobic respiration in muscle cells called?",
    back: "Lactic acid fermentation: pyruvate is reduced to lactate, regenerating NAD⁺ so glycolysis can continue.",
  },
  {
    id: "c6",
    front: "Which stage produces the most ATP?",
    back: "Oxidative phosphorylation on the inner mitochondrial membrane, via ATP synthase.",
    rating: "easy",
  },
];

const seedQuiz: QuizRecord = {
  id: "quiz_seed",
  spaceId: biologySpace.id,
  title: "Cell respiration check",
  topic: "Cell respiration",
  difficulty: "medium",
  questions: seedQuestions,
  shareToken: null,
  createdAt: daysAgo(2, 18),
};

const seedDeck: DeckRecord = {
  id: "deck_seed",
  spaceId: biologySpace.id,
  name: "Cell respiration essentials",
  topic: "Cell respiration",
  cards: seedCards,
  createdAt: daysAgo(2, 17),
};

const seedNote: Note = {
  id: "note_seed",
  spaceId: biologySpace.id,
  title: "Cell respiration cheat sheet",
  markdown: `# Cell respiration

## The three stages
1. **Glycolysis** — cytoplasm, glucose → 2 pyruvate, net 2 ATP + 2 NADH.
2. **Krebs cycle** — mitochondrial matrix, acetyl-CoA → CO₂, NADH, FADH₂.
3. **Oxidative phosphorylation** — inner membrane, electron transport chain + ATP synthase.

## Exam traps
- Glycolysis does **not** need oxygen.
- Oxygen is the *final electron acceptor*, not a reactant of the Krebs cycle.
- Count ATP per glucose, not per pyruvate.

## Quick check
> Why does the electron transport chain stop without oxygen?

Because there is no electron acceptor, the chain backs up, NADH cannot be re-oxidised, and ATP synthase loses its proton gradient.`,
  shareToken: null,
  createdAt: daysAgo(3, 20),
  updatedAt: daysAgo(1, 8),
};

const seedMemory: MemoryRecord = {
  topicId: "space_biology::photosynthesis",
  spaceId: biologySpace.id,
  topicName: "Photosynthesis",
  strength: 72,
  intervalDays: 5.4,
  lastStudiedAt: daysAgo(2, 16),
  nextReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  reason: "You scored 80% on a quiz 2 days ago — a strong result.",
  streak: 2,
  reviews: 2,
  lastSignal: { kind: "quiz", scorePct: 80 },
};

const seedMemoryTwo: MemoryRecord = {
  topicId: "space_maths::quadratic equations",
  spaceId: mathsSpace.id,
  topicName: "Quadratic equations",
  strength: 44,
  intervalDays: 1,
  lastStudiedAt: daysAgo(3, 19),
  nextReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  reason: "You rated a flashcard Hard 3 days ago.",
  streak: 0,
  reviews: 1,
  lastSignal: { kind: "card", rating: "hard" },
};

function buildSeedPlan(): PlanRecord {
  const generated = generateLocalPlan({
    examName: "Biology midterm",
    examDate: inDays(9),
    classStream: "Grade 11 · Science",
    subjects: ["Biology", "Chemistry"],
    dailyMinutes: 90,
  });
  return {
    id: "plan_seed",
    examName: generated.examName,
    examDate: generated.examDate,
    classStream: generated.classStream,
    subjects: generated.subjects,
    dailyMinutes: generated.dailyMinutes,
    days: generated.days.map((day) => ({
      ...day,
      topics: day.topics.map((topic, index) => ({
        ...topic,
        status: index === 0 && day.id === "d1" ? "done" : "not_started",
      })),
    })),
    createdAt: daysAgo(4, 10),
  };
}

const seedSessions: StudySession[] = [
  { id: "session_1", topicId: null, kind: "quiz", durationMin: 18, createdAt: daysAgo(0, 10) },
  { id: "session_2", topicId: null, kind: "flashcards", durationMin: 12, createdAt: daysAgo(0, 10) },
  { id: "session_3", topicId: null, kind: "chat", durationMin: 22, createdAt: daysAgo(1, 19) },
  { id: "session_4", topicId: null, kind: "lesson", durationMin: 30, createdAt: daysAgo(2, 17) },
  { id: "session_5", topicId: null, kind: "revision", durationMin: 15, createdAt: daysAgo(3, 21) },
];

export function createSeedState() {
  return {
    spaces: [biologySpace, mathsSpace, historySpace],
    notes: [seedNote],
    quizzes: [seedQuiz],
    decks: [seedDeck],
    memories: {
      [seedMemory.topicId]: seedMemory,
      [seedMemoryTwo.topicId]: seedMemoryTwo,
    },
    plans: [buildSeedPlan()],
    sessions: seedSessions,
    chats: [],
    messages: [],
    files: [],
    attempts: [],
  };
}

export function emptyState() {
  return {
    spaces: [],
    notes: [],
    quizzes: [],
    decks: [],
    memories: {} as Record<string, MemoryRecord>,
    plans: [],
    sessions: [],
    chats: [],
    messages: [],
    files: [],
    attempts: [],
  };
}
