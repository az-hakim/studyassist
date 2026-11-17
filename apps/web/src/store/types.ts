import type {
  Difficulty,
  ExamPlan,
  Flashcard,
  LearningProfile,
  QuizQuestion,
  Rating,
  TopicMemory,
} from "@studybuddy/shared";

export interface Space {
  id: string;
  name: string;
  subject: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  id: string;
  spaceId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Citation {
  fileName: string;
  page: number;
  text: string;
}

export interface SourceCard {
  title: string;
  url: string;
  domain: string;
}

export interface Message {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  sources: SourceCard[];
  citations: Citation[];
  mode?: "live" | "demo";
  createdAt: string;
}

export interface StoredFile {
  id: string;
  spaceId: string | null;
  name: string;
  mime: string;
  size: number;
  pages: number;
  kind: "text" | "pdf" | "image" | "other";
  text: string;
  createdAt: string;
}

export interface Note {
  id: string;
  spaceId: string | null;
  title: string;
  markdown: string;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuizRecord {
  id: string;
  spaceId: string | null;
  title: string;
  topic: string;
  difficulty: Difficulty;
  questions: QuizQuestion[];
  shareToken: string | null;
  createdAt: string;
}

export interface Attempt {
  id: string;
  quizId: string;
  answers: Record<string, string[]>;
  scorePct: number;
  feedback: string;
  createdAt: string;
}

export interface CardRecord extends Flashcard {
  rating?: Rating;
}

export interface DeckRecord {
  id: string;
  spaceId: string | null;
  name: string;
  topic: string;
  cards: CardRecord[];
  createdAt: string;
}

export interface MemoryRecord extends TopicMemory {
  spaceId: string | null;
  topicName: string;
}

export type TopicStatus = "not_started" | "in_progress" | "done";

export interface PlanTopicRecord {
  id: string;
  name: string;
  subject: string;
  minutes: number;
  status: TopicStatus;
  lessonMarkdown?: string;
}

export interface PlanDayRecord {
  id: string;
  date: string;
  topics: PlanTopicRecord[];
}

export interface PlanRecord {
  id: string;
  examName: string;
  examDate: string;
  classStream?: string;
  subjects: string[];
  dailyMinutes: number;
  days: PlanDayRecord[];
  createdAt: string;
}

export interface StudySession {
  id: string;
  topicId: string | null;
  kind: "chat" | "quiz" | "flashcards" | "lesson" | "revision" | "plan";
  durationMin: number;
  createdAt: string;
}

export type PlanInput = Omit<ExamPlan, "days"> & {
  days: Array<{
    id: string;
    date: string;
    topics: Array<Omit<PlanTopicRecord, "status">>;
  }>;
};

export interface User {
  id: string;
  email: string;
  name: string;
  isGuest: boolean;
  provider: "demo" | "supabase";
}

export type ProfileSettings = Omit<LearningProfile, "displayName">;
