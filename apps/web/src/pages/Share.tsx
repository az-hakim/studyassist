import { ArrowRight, Link2, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { formatDate } from "@studybuddy/shared";

import { Markdown } from "@/components/markdown";
import { QuizRunner } from "@/components/quiz-runner";
import { Badge, Button, Card } from "@/components/ui";
import { useStudyStore } from "@/store/study";

export default function SharePage() {
  const { token } = useParams();

  const notes = useStudyStore((state) => state.notes);
  const quizzes = useStudyStore((state) => state.quizzes);

  const note = notes.find((item) => item.shareToken && item.shareToken === token);
  const quiz = quizzes.find((item) => item.shareToken && item.shareToken === token);

  if (!note && !quiz) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Link2 className="h-5 w-5" />
        </span>
        <h1 className="text-xl font-semibold tracking-tight">This link is not available here</h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Demo-mode share links resolve only in the browser that created them. With Supabase
          connected, the same token is resolved by a public read-only RPC, so anyone with the link
          can open it.
        </p>
        <Link to="/">
          <Button>
            Go to StudyBuddy
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <span className="text-sm font-semibold">StudyBuddy</span>
          </Link>
          <Link to="/login">
            <Button size="sm" variant="secondary">
              Study this too
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {note ? (
          <Card className="p-5 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary">Shared note</Badge>
              <span className="text-[11px] text-muted-foreground">
                Updated {formatDate(note.updatedAt)}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{note.title}</h1>
            <div className="mt-5">
              <Markdown>{note.markdown}</Markdown>
            </div>
          </Card>
        ) : null}

        {quiz ? (
          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary">Shared quiz</Badge>
                <span className="text-[11px] text-muted-foreground">
                  {quiz.questions.length} questions · {quiz.difficulty}
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">{quiz.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Attempt it without an account. Your answers stay in this tab.
              </p>
            </div>
            <QuizRunner questions={quiz.questions} />
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-border/60 bg-muted/30 p-4 text-center">
          <p className="text-[12.5px] text-muted-foreground">
            Made with StudyBuddy — a tutor, quizzes and spaced repetition in one workspace.
          </p>
          <Link to="/login" className="mt-2 inline-block">
            <Button size="sm" variant="secondary">
              Create your own
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
