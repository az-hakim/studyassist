import {
  createMemory,
  updateMemory,
  type Difficulty,
  type Flashcard,
  type Quiz,
  type QuizQuestion,
  type Rating,
  type Signal,
} from "@studybuddy/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { createSeedState, emptyState } from "@/data/seed";
import { newId, shareToken } from "@/lib/utils";
import type {
  Attempt,
  Chat,
  Citation,
  DeckRecord,
  MemoryRecord,
  Message,
  Note,
  PlanInput,
  PlanRecord,
  QuizRecord,
  SourceCard,
  Space,
  StoredFile,
  StudySession,
  TopicStatus,
} from "./types";

export function topicKey(spaceId: string | null, topicName: string): string {
  return `${spaceId ?? "global"}::${topicName.trim().toLowerCase()}`;
}

const SPACE_COLORS = ["indigo", "emerald", "amber", "rose", "sky", "violet"] as const;

interface StudyState {
  spaces: Space[];
  chats: Chat[];
  messages: Message[];
  files: StoredFile[];
  notes: Note[];
  quizzes: QuizRecord[];
  attempts: Attempt[];
  decks: DeckRecord[];
  memories: Record<string, MemoryRecord>;
  plans: PlanRecord[];
  sessions: StudySession[];

  addSpace: (input: { name: string; subject?: string; color?: string }) => string;
  updateSpace: (id: string, patch: Partial<Pick<Space, "name" | "subject" | "color">>) => void;
  deleteSpace: (id: string) => void;

  createChat: (spaceId: string | null, title?: string) => string;
  renameChat: (id: string, title: string) => void;
  deleteChat: (id: string) => void;
  addMessage: (input: {
    chatId: string;
    role: Message["role"];
    content: string;
    sources?: SourceCard[];
    citations?: Citation[];
    mode?: "live" | "demo";
  }) => string;
  updateMessage: (id: string, patch: Partial<Pick<Message, "content" | "sources" | "citations" | "mode">>) => void;

  addFile: (input: Omit<StoredFile, "id" | "createdAt">) => string;

  addNote: (input: { spaceId: string | null; title: string; markdown: string }) => string;
  updateNote: (id: string, patch: Partial<Pick<Note, "title" | "markdown" | "spaceId">>) => void;
  deleteNote: (id: string) => void;
  toggleNoteShare: (id: string) => string | null;

  addQuiz: (input: {
    spaceId: string | null;
    quiz: Pick<Quiz, "title" | "topic" | "difficulty" | "questions">;
  }) => string;
  deleteQuiz: (id: string) => void;
  toggleQuizShare: (id: string) => string | null;
  addAttempt: (input: { quizId: string; answers: Record<string, string[]>; scorePct: number; feedback: string }) => void;

  addDeck: (input: {
    spaceId: string | null;
    name: string;
    topic: string;
    cards: Flashcard[];
  }) => string;
  deleteDeck: (id: string) => void;
  rateCard: (deckId: string, cardId: string, rating: Rating) => void;

  recordSignal: (spaceId: string | null, topicName: string, signal: Signal) => void;
  recordConfidence: (memoryKey: string, level: 1 | 2 | 3) => void;

  addPlan: (input: PlanInput) => string;
  deletePlan: (id: string) => void;
  setTopicStatus: (planId: string, dayId: string, topicId: string, status: TopicStatus) => void;
  saveLesson: (planId: string, dayId: string, topicId: string, markdown: string) => void;

  addSession: (input: { kind: StudySession["kind"]; durationMin: number; topicId?: string | null }) => void;
  resetAll: () => void;
}

function nowIso(): string {
  return new Date().toISOString();
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      ...createSeedState(),

      addSpace: ({ name, subject, color }) => {
        const id = newId("space");
        const timestamp = nowIso();
        const count = get().spaces.length;
        set((state) => ({
          spaces: [
            ...state.spaces,
            {
              id,
              name: name.trim() || "Untitled space",
              subject: (subject ?? name).trim(),
              color: color ?? SPACE_COLORS[count % SPACE_COLORS.length] ?? "indigo",
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          ],
        }));
        return id;
      },

      updateSpace: (id, patch) =>
        set((state) => ({
          spaces: state.spaces.map((space) =>
            space.id === id ? { ...space, ...patch, updatedAt: nowIso() } : space,
          ),
        })),

      deleteSpace: (id) =>
        set((state) => {
          const chatIds = new Set(state.chats.filter((chat) => chat.spaceId === id).map((chat) => chat.id));
          const memories = Object.fromEntries(
            Object.entries(state.memories).filter(([, memory]) => memory.spaceId !== id),
          );
          return {
            spaces: state.spaces.filter((space) => space.id !== id),
            chats: state.chats.filter((chat) => chat.spaceId !== id),
            messages: state.messages.filter((message) => !chatIds.has(message.chatId)),
            notes: state.notes.filter((note) => note.spaceId !== id),
            quizzes: state.quizzes.filter((quiz) => quiz.spaceId !== id),
            decks: state.decks.filter((deck) => deck.spaceId !== id),
            memories,
          };
        }),

      createChat: (spaceId, title) => {
        const id = newId("chat");
        const timestamp = nowIso();
        set((state) => ({
          chats: [
            {
              id,
              spaceId,
              title: title?.trim() || "New chat",
              createdAt: timestamp,
              updatedAt: timestamp,
            },
            ...state.chats,
          ],
        }));
        return id;
      },

      renameChat: (id, title) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === id ? { ...chat, title: title.trim() || chat.title, updatedAt: nowIso() } : chat,
          ),
        })),

      deleteChat: (id) =>
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== id),
          messages: state.messages.filter((message) => message.chatId !== id),
        })),

      addMessage: (input) => {
        const id = newId("msg");
        const timestamp = nowIso();
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id,
              chatId: input.chatId,
              role: input.role,
              content: input.content,
              sources: input.sources ?? [],
              citations: input.citations ?? [],
              mode: input.mode,
              createdAt: timestamp,
            },
          ],
          chats: state.chats.map((chat) =>
            chat.id === input.chatId
              ? {
                  ...chat,
                  updatedAt: timestamp,
                  title:
                    chat.title === "New chat" && input.role === "user"
                      ? input.content.replace(/\s+/g, " ").slice(0, 60)
                      : chat.title,
                }
              : chat,
          ),
        }));
        return id;
      },

      updateMessage: (id, patch) =>
        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === id ? { ...message, ...patch } : message,
          ),
        })),

      addFile: (input) => {
        const id = newId("file");
        set((state) => ({
          files: [{ ...input, id, createdAt: nowIso() }, ...state.files],
        }));
        return id;
      },

      addNote: ({ spaceId, title, markdown }) => {
        const id = newId("note");
        const timestamp = nowIso();
        set((state) => ({
          notes: [
            {
              id,
              spaceId,
              title: title.trim() || "Untitled note",
              markdown,
              shareToken: null,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
            ...state.notes,
          ],
        }));
        return id;
      },

      updateNote: (id, patch) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, ...patch, updatedAt: nowIso() } : note,
          ),
        })),

      deleteNote: (id) =>
        set((state) => ({ notes: state.notes.filter((note) => note.id !== id) })),

      toggleNoteShare: (id) => {
        const note = get().notes.find((item) => item.id === id);
        if (!note) return null;
        const token = note.shareToken ? null : shareToken();
        set((state) => ({
          notes: state.notes.map((item) =>
            item.id === id ? { ...item, shareToken: token, updatedAt: nowIso() } : item,
          ),
        }));
        return token;
      },

      addQuiz: ({ spaceId, quiz }) => {
        const id = newId("quiz");
        set((state) => ({
          quizzes: [
            {
              id,
              spaceId,
              title: quiz.title,
              topic: quiz.topic,
              difficulty: quiz.difficulty,
              questions: quiz.questions,
              shareToken: null,
              createdAt: nowIso(),
            },
            ...state.quizzes,
          ],
        }));
        return id;
      },

      deleteQuiz: (id) =>
        set((state) => ({
          quizzes: state.quizzes.filter((quiz) => quiz.id !== id),
          attempts: state.attempts.filter((attempt) => attempt.quizId !== id),
        })),

      toggleQuizShare: (id) => {
        const quiz = get().quizzes.find((item) => item.id === id);
        if (!quiz) return null;
        const token = quiz.shareToken ? null : shareToken();
        set((state) => ({
          quizzes: state.quizzes.map((item) =>
            item.id === id ? { ...item, shareToken: token } : item,
          ),
        }));
        return token;
      },

      addAttempt: ({ quizId, answers, scorePct, feedback }) => {
        const quiz = get().quizzes.find((item) => item.id === quizId);
        const timestamp = nowIso();
        set((state) => ({
          attempts: [
            ...state.attempts,
            { id: newId("attempt"), quizId, answers, scorePct, feedback, createdAt: timestamp },
          ],
        }));
        if (quiz) {
          get().recordSignal(quiz.spaceId, quiz.topic, { kind: "quiz", scorePct });
        }
      },

      addDeck: ({ spaceId, name, topic, cards }) => {
        const id = newId("deck");
        set((state) => ({
          decks: [
            {
              id,
              spaceId,
              name: name.trim() || `${topic} deck`,
              topic,
              cards,
              createdAt: nowIso(),
            },
            ...state.decks,
          ],
        }));
        return id;
      },

      deleteDeck: (id) =>
        set((state) => ({ decks: state.decks.filter((deck) => deck.id !== id) })),

      rateCard: (deckId, cardId, rating) => {
        const deck = get().decks.find((item) => item.id === deckId);
        if (!deck) return;
        set((state) => ({
          decks: state.decks.map((item) =>
            item.id === deckId
              ? {
                  ...item,
                  cards: item.cards.map((card) =>
                    card.id === cardId ? { ...card, rating } : card,
                  ),
                }
              : item,
          ),
        }));
        get().recordSignal(deck.spaceId, deck.topic, { kind: "card", rating });
      },

      recordSignal: (spaceId, topicName, signal) => {
        const key = topicKey(spaceId, topicName);
        set((state) => {
          const existing = state.memories[key];
          const base: MemoryRecord = existing ?? {
            ...createMemory(key),
            spaceId,
            topicName: topicName.trim(),
          };
          const updated = updateMemory(base, signal, new Date());
          return {
            memories: {
              ...state.memories,
              [key]: { ...updated, spaceId, topicName: topicName.trim() },
            },
          };
        });
      },

      recordConfidence: (memoryKey, level) => {
        const memory = get().memories[memoryKey];
        if (!memory) return;
        set((state) => ({
          memories: {
            ...state.memories,
            [memoryKey]: {
              ...updateMemory(memory, { kind: "confidence", level }, new Date()),
              spaceId: memory.spaceId,
              topicName: memory.topicName,
            },
          },
        }));
        get().addSession({ kind: "revision", durationMin: 3, topicId: memoryKey });
      },

      addPlan: (input) => {
        const id = newId("plan");
        set((state) => ({
          plans: [
            {
              id,
              examName: input.examName,
              examDate: input.examDate,
              classStream: input.classStream,
              subjects: input.subjects,
              dailyMinutes: input.dailyMinutes,
              days: input.days.map((day) => ({
                ...day,
                topics: day.topics.map((topic) => ({ ...topic, status: "not_started" as TopicStatus })),
              })),
              createdAt: nowIso(),
            },
            ...state.plans,
          ],
        }));
        return id;
      },

      deletePlan: (id) =>
        set((state) => ({ plans: state.plans.filter((plan) => plan.id !== id) })),

      setTopicStatus: (planId, dayId, topicId, status) =>
        set((state) => ({
          plans: state.plans.map((plan) =>
            plan.id !== planId
              ? plan
              : {
                  ...plan,
                  days: plan.days.map((day) =>
                    day.id !== dayId
                      ? day
                      : {
                          ...day,
                          topics: day.topics.map((topic) =>
                            topic.id === topicId ? { ...topic, status } : topic,
                          ),
                        },
                  ),
                },
          ),
        })),

      saveLesson: (planId, dayId, topicId, markdown) =>
        set((state) => ({
          plans: state.plans.map((plan) =>
            plan.id !== planId
              ? plan
              : {
                  ...plan,
                  days: plan.days.map((day) =>
                    day.id !== dayId
                      ? day
                      : {
                          ...day,
                          topics: day.topics.map((topic) =>
                            topic.id === topicId ? { ...topic, lessonMarkdown: markdown } : topic,
                          ),
                        },
                  ),
                },
          ),
        })),

      addSession: ({ kind, durationMin, topicId }) =>
        set((state) => ({
          sessions: [
            ...state.sessions,
            {
              id: newId("session"),
              kind,
              durationMin: Math.max(1, Math.round(durationMin)),
              topicId: topicId ?? null,
              createdAt: nowIso(),
            },
          ],
        })),

      resetAll: () => set(emptyState()),
    }),
    {
      name: "studybuddy.study.v1",
      version: 1,
      partialize: (state) => ({
        spaces: state.spaces,
        chats: state.chats,
        messages: state.messages,
        files: state.files,
        notes: state.notes,
        quizzes: state.quizzes,
        attempts: state.attempts,
        decks: state.decks,
        memories: state.memories,
        plans: state.plans,
        sessions: state.sessions,
      }),
    },
  ),
);

/** Re-seed an empty workspace (used by Settings → restore demo data). */
export function reseedDemo(): void {
  useStudyStore.setState({ ...createSeedState() });
}

export const spaceColorClasses: Record<string, { dot: string; soft: string; text: string }> = {
  indigo: { dot: "bg-indigo-500", soft: "bg-indigo-500/10", text: "text-indigo-500" },
  emerald: { dot: "bg-emerald-500", soft: "bg-emerald-500/10", text: "text-emerald-500" },
  amber: { dot: "bg-amber-500", soft: "bg-amber-500/10", text: "text-amber-500" },
  rose: { dot: "bg-rose-500", soft: "bg-rose-500/10", text: "text-rose-500" },
  sky: { dot: "bg-sky-500", soft: "bg-sky-500/10", text: "text-sky-500" },
  violet: { dot: "bg-violet-500", soft: "bg-violet-500/10", text: "text-violet-500" },
};

export function questionsFor(record: QuizRecord): QuizQuestion[] {
  return record.questions;
}

export function recentAttemptFor(attempts: Attempt[], quizId: string): Attempt | undefined {
  return [...attempts].reverse().find((attempt) => attempt.quizId === quizId);
}

export type { Difficulty };
