import {
  feedbackForScore,
  gradeQuiz,
  type GradeResult,
  type QuizQuestion,
} from "@studybuddy/shared";
import { Check, ChevronRight, RotateCcw, Trophy, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button, Card, Progress } from "@/components/ui";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<QuizQuestion["type"], string> = {
  single: "Single choice",
  multi: "Select all that apply",
  tf: "True or false",
};

export function QuizRunner({
  questions,
  onGraded,
  compact = false,
}: {
  questions: QuizQuestion[];
  onGraded?: (result: GradeResult, answers: Record<string, string[]>) => void;
  compact?: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<GradeResult | null>(null);
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    setAnswers({});
    setResult(null);
  }, [questions]);

  const answered = useMemo(
    () =>
      questions.filter((question) => (answers[question.id]?.length ?? 0) > 0).length,
    [answers, questions],
  );

  const toggle = (question: QuizQuestion, optionId: string) => {
    if (result) return;
    setAnswers((current) => {
      const existing = current[question.id] ?? [];
      if (question.type === "multi") {
        return {
          ...current,
          [question.id]: existing.includes(optionId)
            ? existing.filter((id) => id !== optionId)
            : [...existing, optionId],
        };
      }
      return { ...current, [question.id]: [optionId] };
    });
  };

  const submit = () => {
    if (answered < questions.length) return;
    const graded = gradeQuiz({ questions }, answers);
    setResult(graded);
    onGraded?.(graded, answers);
  };

  const retry = () => {
    setAnswers({});
    setResult(null);
  };

  const elapsedMinutes = Math.max(1, Math.round((Date.now() - startedAt) / 60_000));

  return (
    <div className="space-y-4">
      {result ? (
        <Card className="overflow-hidden border-success/30">
          <div className="flex flex-wrap items-center gap-4 bg-success/5 p-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 text-success">
              <Trophy className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
                Your score
              </p>
              <p className="text-3xl font-semibold tracking-tight">{result.scorePct}%</p>
              <p className="text-[12.5px] text-muted-foreground">
                {result.correctCount} of {result.total} correct · about {elapsedMinutes} min
              </p>
            </div>
            <div className="w-full sm:w-48">
              <Progress
                value={result.scorePct}
                tone={result.scorePct >= 75 ? "success" : result.scorePct >= 50 ? "warning" : "danger"}
              />
            </div>
          </div>
          <div className="border-t border-border/60 p-5">
            <p className="text-[13.5px] leading-relaxed text-foreground/90">
              {feedbackForScore(result.scorePct)}
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
              <span>
                {answered} of {questions.length} answered
              </span>
              <span>{TYPE_LABELS[questions[0]?.type ?? "single"]} first</span>
            </div>
            <Progress value={(answered / Math.max(1, questions.length)) * 100} className="mt-1.5" />
          </div>
        </div>
      )}

      <div className={cn("space-y-4", compact && "space-y-3")}>
        {questions.map((question, index) => {
          const graded = result?.results.find((item) => item.questionId === question.id);
          const selected = answers[question.id] ?? [];
          return (
            <Card key={question.id} className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[12px] font-semibold text-primary">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium leading-relaxed">{question.prompt}</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {TYPE_LABELS[question.type]}
                  </p>

                  <div className="mt-3 space-y-2">
                    {question.options.map((option) => {
                      const isSelected = selected.includes(option.id);
                      const isCorrect = graded ? question.answer.includes(option.id) : false;
                      const isWrongPick = Boolean(graded && isSelected && !isCorrect);

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggle(question, option.id)}
                          aria-pressed={isSelected}
                          disabled={Boolean(result)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-[13.5px] transition",
                            !graded &&
                              (isSelected
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border/70 hover:border-primary/40 hover:bg-muted/40"),
                            graded &&
                              (isCorrect
                                ? "border-success/50 bg-success/10"
                                : isWrongPick
                                  ? "border-danger/50 bg-danger/10"
                                  : "border-border/60 opacity-80"),
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold uppercase",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-muted-foreground",
                              graded && isCorrect && "border-success bg-success text-white",
                              graded && isWrongPick && "border-danger bg-danger text-white",
                            )}
                          >
                            {graded && isCorrect ? (
                              <Check className="h-3 w-3" />
                            ) : graded && isWrongPick ? (
                              <X className="h-3 w-3" />
                            ) : (
                              option.id.slice(0, 1)
                            )}
                          </span>
                          <span className="flex-1">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {graded ? (
                    <div
                      className={cn(
                        "mt-3 rounded-xl border p-3 text-[12.5px] leading-relaxed",
                        graded.correct
                          ? "border-success/30 bg-success/5"
                          : "border-danger/30 bg-danger/5",
                      )}
                    >
                      <p className="font-medium">
                        {graded.correct ? "Correct" : "Not quite"}
                        {!graded.correct ? (
                          <span className="ml-1.5 font-normal text-muted-foreground">
                            Answer:{" "}
                            {question.options
                              .filter((option) => question.answer.includes(option.id))
                              .map((option) => option.label)
                              .join(", ")}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-muted-foreground">{question.explanation}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11.5px] text-muted-foreground">
          {result
            ? "Every question is shown with the correct answer and an explanation."
            : "Answer every question to unlock grading."}
        </p>
        {result ? (
          <Button variant="secondary" onClick={retry}>
            <RotateCcw className="h-4 w-4" />
            Try again
          </Button>
        ) : (
          <Button onClick={submit} disabled={answered < questions.length}>
            Submit answers
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
