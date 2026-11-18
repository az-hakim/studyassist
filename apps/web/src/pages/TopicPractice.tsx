import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Check,
  Clock,
  GraduationCap,
  Layers,
  MessageCircle,
  Pause,
  Play,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  formatDateShort,
  formatDuration,
  type Quiz,
} from "@studybuddy/shared";

import { Markdown } from "@/components/markdown";
import { QuizRunner } from "@/components/quiz-runner";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Select,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@/components/ui";
import { askScopedDoubt } from "@/lib/ai";
import { requestLesson, requestQuiz, requestDeck } from "@/lib/structured";
import { cn, formatClock, truncate } from "@/lib/utils";
import { useLearningProfile } from "@/store/auth";
import { useStudyStore } from "@/store/study";
import { toast } from "@/store/toast";
import type { TopicStatus } from "@/store/types";

const TIMER_PRESETS = [15, 25, 45];

export default function TopicPracticePage() {
  const { planId, topicId } = useParams();
  const profile = useLearningProfile();

  const plans = useStudyStore((state) => state.plans);
  const saveLesson = useStudyStore((state) => state.saveLesson);
  const setTopicStatus = useStudyStore((state) => state.setTopicStatus);
  const recordSignal = useStudyStore((state) => state.recordSignal);
  const addSession = useStudyStore((state) => state.addSession);
  const addDeck = useStudyStore((state) => state.addDeck);

  const plan = plans.find((item) => item.id === planId);
  const day = plan?.days.find((candidate) =>
    candidate.topics.some((topic) => topic.id === topicId),
  );
  const topic = day?.topics.find((candidate) => candidate.id === topicId);

  const [tab, setTab] = useState("lesson");
  const [practiceQuiz, setPracticeQuiz] = useState<Quiz | null>(null);
  const [doubtMessages, setDoubtMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [doubtDraft, setDoubtDraft] = useState("");
  const [doubtBusy, setDoubtBusy] = useState(false);
  const doubtStreamRef = useRef("");
  const doubtEndRef = useRef<HTMLDivElement>(null);

  const [preset, setPreset] = useState(25);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const completedRef = useRef(false);

  const lessonMutation = useMutation({
    mutationFn: async () => {
      if (!topic) throw new Error("Missing topic");
      return requestLesson({ topic: topic.name, subject: topic.subject });
    },
    onSuccess: ({ lesson, mode }) => {
      if (plan && day && topic) {
        saveLesson(plan.id, day.id, topic.id, lesson.markdown);
        if (topic.status === "not_started") setTopicStatus(plan.id, day.id, topic.id, "in_progress");
      }
      toast(
        mode === "demo" ? "Offline lesson ready." : "Lesson written by Aeva.",
        "success",
      );
    },
    onError: () => toast("Could not generate the lesson.", "error"),
  });

  const practiceMutation = useMutation({
    mutationFn: async () => {
      if (!topic) throw new Error("Missing topic");
      return requestQuiz({
        topic: topic.name,
        difficulty: "medium",
        count: 3,
        types: ["single", "tf"],
      });
    },
    onSuccess: ({ quiz, mode }) => {
      setPracticeQuiz(quiz);
      toast(mode === "demo" ? "Practice quiz ready." : "Practice quiz written by Aeva.", "success");
    },
    onError: () => toast("Could not build practice questions.", "error"),
  });

  const deckMutation = useMutation({
    mutationFn: async () => {
      if (!topic) throw new Error("Missing topic");
      return requestDeck({ topic: topic.name, count: 8 });
    },
    onSuccess: ({ deck }) => {
      if (!topic) return;
      addDeck({
        spaceId: null,
        name: `${topic.name} deck`,
        topic: topic.name,
        cards: deck.cards,
      });
      toast("Deck saved to Flashcards.", "success");
    },
    onError: () => toast("Could not build a deck.", "error"),
  });

  useEffect(() => {
    setSeconds(preset * 60);
    setRunning(false);
    completedRef.current = false;
  }, [preset]);

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      if (!completedRef.current && topic) {
        completedRef.current = true;
        addSession({ kind: "lesson", durationMin: preset, topicId: topic.id });
        toast(`Focus session complete — ${preset} minutes logged.`, "success");
        if (plan && day && topic.status !== "done") {
          setTopicStatus(plan.id, day.id, topic.id, "in_progress");
        }
      }
      return;
    }
    const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [running, seconds, preset, addSession, setTopicStatus, plan, day, topic]);

  useEffect(() => {
    doubtEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [doubtMessages.length, doubtBusy]);

  const statusLabel = useMemo(() => {
    if (!topic) return "";
    return topic.status === "done" ? "Completed" : topic.status === "in_progress" ? "In progress" : "Not started";
  }, [topic]);

  if (!plan || !day || !topic) {
    return (
      <EmptyState
        icon={<BookOpen className="h-5 w-5" />}
        title="Topic not found"
        description="This topic may belong to a deleted plan."
        action={
          <Link to="/app/planner">
            <Button variant="secondary">Back to planner</Button>
          </Link>
        }
      />
    );
  }

  const askDoubt = async () => {
    const question = doubtDraft.trim();
    if (!question || doubtBusy) return;
    setDoubtDraft("");
    setDoubtMessages((current) => [...current, { role: "user", content: question }]);
    setDoubtBusy(true);
    doubtStreamRef.current = "";
    setDoubtMessages((current) => [...current, { role: "assistant", content: "" }]);

    try {
      await askScopedDoubt({
        question,
        topicName: topic.name,
        subject: topic.subject,
        profile,
        onToken: (token) => {
          doubtStreamRef.current += token;
          setDoubtMessages((current) => {
            const copy = [...current];
            const last = copy[copy.length - 1];
            if (last && last.role === "assistant") {
              copy[copy.length - 1] = { ...last, content: doubtStreamRef.current };
            }
            return copy;
          });
        },
      });
      addSession({ kind: "lesson", durationMin: 1, topicId: topic.id });
    } catch {
      setDoubtMessages((current) => [
        ...current.slice(0, -1),
        { role: "assistant", content: "Aeva could not answer that just now. Try again." },
      ]);
    } finally {
      setDoubtBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <Link
          to={`/app/planner/${plan.id}`}
          className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {plan.examName}
        </Link>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{topic.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {topic.subject} · {formatDuration(topic.minutes)} · {formatDateShort(day.date)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={topic.status === "done" ? "success" : topic.status === "in_progress" ? "warning" : "neutral"}>
              {statusLabel}
            </Badge>
            <Select
              aria-label="Topic status"
              value={topic.status}
              className="h-9 w-40 text-[12px]"
              onChange={(event) =>
                setTopicStatus(plan.id, day.id, topic.id, event.target.value as TopicStatus)
              }
            >
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </Select>
          </div>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab}>
        <TabsList>
          <TabsTrigger value="lesson" icon={<BookOpen className="h-3.5 w-3.5" />}>
            Lesson
          </TabsTrigger>
          <TabsTrigger value="practice" icon={<GraduationCap className="h-3.5 w-3.5" />}>
            Practice
          </TabsTrigger>
          <TabsTrigger value="doubt" icon={<MessageCircle className="h-3.5 w-3.5" />}>
            Doubt box
          </TabsTrigger>
          <TabsTrigger value="timer" icon={<Clock className="h-3.5 w-3.5" />}>
            Focus timer
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "lesson" ? (
        <Card className="p-5">
          {topic.lessonMarkdown ? (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant="primary">Lesson</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => lessonMutation.mutate()}
                  loading={lessonMutation.isPending}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Regenerate
                </Button>
              </div>
              <Markdown>{topic.lessonMarkdown}</Markdown>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Brain className="h-5 w-5" />
              </span>
              <p className="text-sm font-semibold">No lesson yet</p>
              <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                Aeva writes: why it matters, core ideas, worked examples, things to remember,
                common mistakes and a self-check.
              </p>
              <Button onClick={() => lessonMutation.mutate()} loading={lessonMutation.isPending}>
                <Sparkles className="h-4 w-4" />
                Generate lesson
              </Button>
            </div>
          )}
        </Card>
      ) : null}

      {tab === "practice" ? (
        <div className="space-y-4">
          {practiceQuiz ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{practiceQuiz.title}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPracticeQuiz(null);
                    practiceMutation.mutate();
                  }}
                  loading={practiceMutation.isPending}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  New questions
                </Button>
              </div>
              <QuizRunner
                questions={practiceQuiz.questions}
                compact
                onGraded={(result) => {
                  recordSignal(null, topic.name, { kind: "quiz", scorePct: result.scorePct });
                  addSession({ kind: "quiz", durationMin: 4, topicId: topic.id });
                  if (topic.status !== "done") {
                    setTopicStatus(plan.id, day.id, topic.id, "in_progress");
                  }
                  toast(`Score ${result.scorePct}% saved to this topic.`, "success");
                }}
              />
            </>
          ) : (
            <Card className="flex flex-col items-center gap-3 p-8 text-center">
              <GraduationCap className="h-6 w-6 text-primary" />
              <p className="text-sm font-semibold">Three questions, instant feedback</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Results feed this topic's memory strength, so the revision dashboard stays accurate.
              </p>
              <Button onClick={() => practiceMutation.mutate()} loading={practiceMutation.isPending}>
                <Sparkles className="h-4 w-4" />
                Generate practice quiz
              </Button>
            </Card>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 p-3">
            <p className="text-[12px] text-muted-foreground">
              Prefer cards? Build a deck for this topic and review it with ratings.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => deckMutation.mutate()}
              loading={deckMutation.isPending}
            >
              <Layers className="h-3.5 w-3.5" />
              Create flashcard deck
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "doubt" ? (
        <Card className="flex min-h-[420px] flex-col overflow-hidden">
          <div className="flex-1 space-y-3 p-4">
            {doubtMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
                <MessageCircle className="h-6 w-6 text-primary" />
                <p className="text-sm font-semibold">Scoped doubt box</p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Aeva answers only within {topic.name}, so you do not drift into another topic.
                </p>
              </div>
            ) : (
              doubtMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                    message.role === "user"
                      ? "ml-auto rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md border border-border/60 bg-muted/40",
                  )}
                >
                  {message.role === "assistant" ? (
                    message.content ? (
                      <Markdown>{message.content}</Markdown>
                    ) : (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Spinner className="h-3.5 w-3.5" /> thinking…
                      </span>
                    )
                  ) : (
                    message.content
                  )}
                </div>
              ))
            )}
            <div ref={doubtEndRef} />
          </div>
          <div className="border-t border-border/60 p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={doubtDraft}
                onChange={(event) => setDoubtDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void askDoubt();
                  }
                }}
                rows={1}
                placeholder={`Ask about ${truncate(topic.name, 40)}…`}
                className="min-h-[44px] resize-none"
                aria-label="Ask a doubt"
              />
              <Button
                size="icon"
                onClick={() => void askDoubt()}
                disabled={doubtBusy || doubtDraft.trim().length === 0}
                aria-label="Send doubt"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {tab === "timer" ? (
        <Card className="flex flex-col items-center p-8 text-center">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Focus session</p>
          <p className="mt-2 font-mono text-5xl font-semibold tabular-nums">{formatClock(seconds)}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {TIMER_PRESETS.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => setPreset(minutes)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
                  preset === minutes
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {minutes} min
              </button>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <Button onClick={() => setRunning((value) => !value)}>
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? "Pause" : "Start"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setRunning(false);
                setSeconds(preset * 60);
                completedRef.current = false;
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
          <p className="mt-4 max-w-sm text-[11.5px] text-muted-foreground">
            Completed sessions are logged automatically and move this topic to in progress.
          </p>
          {topic.status === "done" ? (
            <p className="mt-3 flex items-center gap-1 text-[11.5px] text-success">
              <Check className="h-3.5 w-3.5" /> Topic marked done
            </p>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
