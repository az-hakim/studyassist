import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui";

export default function AboutPage() {
  return (
    <SiteLayout>
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">About</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight">
          Study with AI that helps you actually learn
        </h1>
        <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
          StudyAssistant — and Aeva, its AI study buddy — exist to turn answers into understanding.
        </p>

        <div className="mt-10 space-y-9">
          <section>
            <h2 className="text-[19px] font-semibold tracking-tight">Our mission</h2>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground">
              Most AI tools hand students an answer and stop there. We built StudyAssistant to do
              the opposite: help you understand the material, practice it, and remember it. Every
              answer can become a quiz, a flashcard deck, or a study plan — so learning doesn't end
              when the chat does.
            </p>
          </section>

          <section>
            <h2 className="text-[19px] font-semibold tracking-tight">How it works</h2>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground">
              Chat with Aeva using your own notes and PDFs, or search the live web with cited
              sources. From any response you can generate practice quizzes and flashcards, keep
              everything organized in study spaces and notes, and track your performance. Then AI
              Revision Mode takes over: it tracks how well you know each topic and schedules
              spaced-repetition reviews so you remember what you learned. It's one connected
              learning system rather than a pile of separate tools.
            </p>
          </section>

          <section>
            <h2 className="text-[19px] font-semibold tracking-tight">Built for students</h2>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground">
              StudyAssistant is an AI homework helper, exam-preparation coach, and revision tool in
              one. Whether you're preparing for exams, working through homework, or reviewing
              lecture notes, it adapts to how you learn — your education level, preferred language,
              and explanation style shape every answer.
            </p>
          </section>

          <section>
            <h2 className="text-[19px] font-semibold tracking-tight">Your data</h2>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground">
              Your sessions, uploads, quizzes, and flashcards are tied to your account and only
              accessible to you. Read our{" "}
              <Link to="/privacy" className="text-primary underline-offset-4 hover:underline">
                Privacy Policy
              </Link>{" "}
              for the details.
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/login">
            <Button size="lg" variant="gradient">
              Start learning free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/features">
            <Button size="lg" variant="outline">
              Explore features
            </Button>
          </Link>
        </div>
      </main>
    </SiteLayout>
  );
}
