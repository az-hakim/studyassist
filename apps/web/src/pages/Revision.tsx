import {
  ArrowRight,
  Brain,
  CalendarClock,
  Flame,
  GraduationCap,
  Sparkles,
  Target,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  bucket,
  daysUntilReview,
  formatDate,
  reasonFor,
  type Bucket,
} from "@studybuddy/shared";

import { Badge, Button, Card, EmptyState, Progress, StatCard, Tabs, TabsList, TabsTrigger } from "@/components/ui";
import { averageStrength, currentStreak } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { useStudyStore } from "@/store/study";
import { toast } from "@/store/toast";

const BUCKET_META: Record<Bucket, { label: string; variant: "danger" | "warning" | "success" | "neutral" }> = {
  needs_revision: { label: "Needs revision", variant: "danger" },
  due_today: { label: "Due today", variant: "warning" },
  mastered: { label: "Mastered", variant: "success" },
  ok: { label: "On track", variant: "neutral" },
};

const CONFIDENCE = [
  { level: 1 as const, emoji: "😕", label: "Unsure" },
  { level: 2 as const, emoji: "🙂", label: "Okay" },
  { level: 3 as const, emoji: "😎", label: "Confident" },
];

export default function RevisionPage() {
  const navigate = useNavigate();
  const memories = useStudyStore((state) => state.memories);
  const spaces = useStudyStore((state) => state.spaces);
  const sessions = useStudyStore((state) => state.sessions);
  const attempts = useStudyStore((state) => state.attempts);
  const recordConfidence = useStudyStore((state) => state.recordConfidence);

  const [filter, setFilter] = useState<"all" | Bucket>("all");

  const rows = useMemo(
    () =>
      Object.values(memories)
        .map((memory) => ({ memory, bucket: bucket(memory), reason: reasonFor(memory) }))
        .sort((a, b) => a.memory.strength - b.memory.strength),
    [memories],
  );

  const counts = useMemo(() => {
    const base = { needs_revision: 0, due_today: 0, mastered: 0, ok: 0 };
    for (const row of rows) base[row.bucket] += 1;
    return base;
  }, [rows]);

  const filtered = filter === "all" ? rows : rows.filter((row) => row.bucket === filter);

  const streak = currentStreak([
    ...Object.values(memories).map((memory) => ({ at: memory.lastStudiedAt })),
    ...sessions.map((session) => ({ at: session.createdAt })),
    ...attempts.map((attempt) => ({ at: attempt.createdAt })),
  ]);

  const dueNow = counts.needs_revision + counts.due_today;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Revision</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What to review, when, and exactly why. Confidence check-ins adjust the schedule.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Due now" value={dueNow} hint="Weak or scheduled" icon={<Target className="h-5 w-5" />} />
        <StatCard
          label="Topics tracked"
          value={rows.length}
          hint={`${counts.mastered} mastered`}
          icon={<Brain className="h-5 w-5" />}
        />
        <StatCard
          label="Average strength"
          value={`${averageStrength(Object.values(memories))}%`}
          hint="Across all topics"
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          label="Review streak"
          value={`${streak} ${streak === 1 ? "day" : "days"}`}
          hint="Consistency beats cramming"
          icon={<Flame className="h-5 w-5" />}
        />
      </div>

      <Tabs value={filter} onChange={(value) => setFilter(value as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All ({rows.length})</TabsTrigger>
          <TabsTrigger value="needs_revision">Needs revision ({counts.needs_revision})</TabsTrigger>
          <TabsTrigger value="due_today">Due today ({counts.due_today})</TabsTrigger>
          <TabsTrigger value="mastered">Mastered ({counts.mastered})</TabsTrigger>
          <TabsTrigger value="ok">On track ({counts.ok})</TabsTrigger>
        </TabsList>
      </Tabs>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-5 w-5" />}
          title="Nothing tracked yet"
          description="Quiz results, flashcard ratings and confidence check-ins create topic memories automatically."
          action={
            <Button onClick={() => navigate("/app/quiz")}>
              <GraduationCap className="h-4 w-4" />
              Make a quiz
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nothing in this bucket"
          description="Switch tabs to see the rest of your topics."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(({ memory, bucket: memoryBucket, reason }) => {
            const meta = BUCKET_META[memoryBucket];
            const space = spaces.find((candidate) => candidate.id === memory.spaceId);
            const days = daysUntilReview(memory);
            return (
              <Card key={memory.topicId} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[14.5px] font-semibold">{memory.topicName}</h2>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      {space ? <span className="text-[11px] text-muted-foreground">{space.name}</span> : null}
                      {memory.streak >= 2 ? (
                        <span className="flex items-center gap-1 text-[11px] text-warning">
                          <Flame className="h-3 w-3" /> {memory.streak} streak
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[12.5px] text-muted-foreground">{reason}</p>

                    <div className="mt-3 max-w-xl">
                      <div className="flex items-center justify-between text-[10.5px] text-muted-foreground">
                        <span>Strength {memory.strength}/100</span>
                        <span>
                          {days <= 0
                            ? "Review now"
                            : `Next in ${days} ${days === 1 ? "day" : "days"}`}
                          {` · ${formatDate(memory.nextReviewAt)}`}
                        </span>
                      </div>
                      <Progress
                        value={memory.strength}
                        className="mt-1.5 h-1.5"
                        tone={
                          memory.strength < 50
                            ? "danger"
                            : memory.strength >= 80
                              ? "success"
                              : "warning"
                        }
                      />
                    </div>
                  </div>

                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/30 p-1">
                      {CONFIDENCE.map((option) => (
                        <button
                          key={option.level}
                          type="button"
                          title={`I feel ${option.label.toLowerCase()}`}
                          aria-label={`Check in: ${option.label}`}
                          onClick={() => {
                            recordConfidence(memory.topicId, option.level);
                            toast(
                              option.level === 1
                                ? "Scheduled sooner. Let's rebuild this topic."
                                : option.level === 3
                                  ? "Nice — next review pushed further out."
                                  : "Logged. Next review stays on schedule.",
                              option.level === 1 ? "info" : "success",
                            );
                          }}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg text-lg transition hover:bg-card",
                          )}
                        >
                          {option.emoji}
                        </button>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        navigate(
                          `/app/quiz?topic=${encodeURIComponent(memory.topicName)}${
                            memory.spaceId ? `&space=${memory.spaceId}` : ""
                          }`,
                        )
                      }
                    >
                      Practice
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <CalendarClock className="h-4 w-4 text-primary" />
        <p className="text-[12px] text-muted-foreground">
          The scheduler blends quiz scores (60% new evidence), card ratings and confidence into one
          strength score, then spaces the next review between 1 and 21 days.
        </p>
      </Card>
    </div>
  );
}
