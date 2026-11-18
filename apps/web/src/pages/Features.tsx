import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui";

const SECTIONS = [
  {
    title: "AI Revision Mode with spaced repetition",
    body: "StudyAssistant tracks a memory-strength score for every topic and schedules reviews just before you forget. Your dashboard shows what needs immediate revision, what's due today, and what you've recently mastered — with a reason for each, and one-tap actions to revise, quiz, or review flashcards.",
  },
  {
    title: "AI Exam Prep: a plan for every day, a lesson for every topic",
    body: "Pick your exam — school, board, college, or a single subject or unit test — and give the date, class or stream, subjects, and daily study time. Aeva researches the official syllabus, builds a day-by-day plan, and teaches each topic with a full lesson, on-demand quizzes and flashcards, a study timer, progress tracking, and a doubt box. Entrance exams such as JEE, NEET, and UPSC are not covered yet.",
  },
  {
    title: "AI chat that understands your material",
    body: "Ask Aeva anything and get clear, sourced answers grounded in your own notes, PDFs, and images — not generic guesses. It's an AI tutor that helps with homework at any level.",
  },
  {
    title: "Chat with your PDFs and notes",
    body: "Upload documents and Aeva retrieves the exact pages that answer your question, with page-level citations you can click.",
  },
  {
    title: "Live web search",
    body: "When your notes aren't enough, Aeva searches the web and cites its sources so you can verify every claim.",
  },
  {
    title: "One-click AI quiz generator",
    body: "Turn any answer or document into a graded practice quiz. Pick the topic, difficulty, and question types — MCQ, multi-select, or true/false — and get instant AI feedback.",
  },
  {
    title: "Automatic AI flashcards",
    body: "Generate flashcard decks from your material, then flip, shuffle, and rate each card to track your mastery over time.",
  },
  {
    title: "Study Spaces for every subject",
    body: "Create a workspace per subject that keeps chats, notes, quizzes, flashcards, and files together. Each space tracks its own progress and weak topics, so you always know where you stand.",
  },
  {
    title: "A real notes editor",
    body: "Write markdown notes, save any AI answer as a note and refine it, condense chapters into revision-ready summaries, then export to PDF or share with a link.",
  },
  {
    title: "Share quizzes, results, and notes",
    body: "Create a public link for any quiz, quiz result, or note. Friends can attempt your shared quiz without an account — perfect for group revision.",
  },
  {
    title: "Performance analytics",
    body: "See study time, streaks, quiz trends, a subject-by-subject breakdown, and achievements — plus analysis of exactly what to revise next.",
  },
  {
    title: "Personalized learning",
    body: "Set your education level, language, and explanation style once — every answer adapts to how you learn.",
  },
  {
    title: "Bookmarks and folders",
    body: "Save responses, quizzes, and flashcards into folders and start a fresh session from any saved item.",
  },
  {
    title: "Global search",
    body: "Find anything across your sessions, messages, quizzes, flashcards, and uploads from one fast search bar.",
  },
];

export default function FeaturesPage() {
  return (
    <SiteLayout>
      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Features</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight">
          AI study tools for everything you're learning
        </h1>
        <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-muted-foreground">
          StudyAssistant is a complete AI study assistant — chat, PDF analysis, quizzes, flashcards,
          day-by-day exam plans with topic lessons, spaced-repetition revision, and analytics
          working together, not a collection of disconnected tools.
        </p>

        <div className="mt-12 divide-y divide-border/60 border-y border-border/60">
          {SECTIONS.map((section) => (
            <section key={section.title} className="py-7">
              <h2 className="text-[19px] font-semibold tracking-tight">{section.title}</h2>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/login">
            <Button size="lg" variant="gradient">
              Start learning free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/">
            <Button size="lg" variant="outline">
              See how it works
            </Button>
          </Link>
        </div>
      </main>
    </SiteLayout>
  );
}
