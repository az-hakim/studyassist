import {
  ArrowRight,
  Brain,
  CalendarClock,
  Flame,
  GraduationCap,
  Layers,
  MessageSquare,
  NotebookPen,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMemo } from "react";

import { formatDuration, reasonFor } from "@studybuddy/shared";

import { formatRelative } from "@/components/bits";
import { Badge, Button, Card, EmptyState, Progress, SectionHeading, StatCard } from "@/components/ui";
import { averageStrength, currentStreak } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { spaceColorClasses, useStudyStore } from "@/store/study";

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const spaces = useStudyStore((state) => state.spaces);
  const memories = useStudyStore((state) => state.memories);
  const sessions = useStudyStore((state) => state.sessions);
  const notes = useStudyStore((state) => state.notes);
  const quizzes = useStudyStore((state) => state.quizzes);
  const decks = useStudyStore((state) => state.decks);
  const plans = useStudyStore((state) => state.plans);
  const attempts = useStudyStore((state) => state.attempts);
  const addSpace = useStudyStore((state) => state.addSpace);

  const memoryList = useMemo(() => Object.values(memories), [memories]);

  const stats = useMemo(() => {
    const streakItems = [
      ...memoryList.map((memory) => ({ at: memory.lastStudiedAt })),
      ...sessions.map((session) => ({ at: session.createdAt })),
      ...attempts.map((attempt) => ({ at: attempt.createdAt })),
    ];
    const weekStart = Date.now() - 7 * 86_400_000;
    const weekMinutes = sessions
      .filter((session) => new Date(session.createdAt).getTime() >= weekStart)
      .reduce((sum, session) => sum + session.durationMin, 0);
    const due = memoryList.filter((memory) => {
      const next = new Date(memory.nextReviewAt).getTime();
      return memory.strength < 50 || next <= Date.now();
    });
    return {
      streak: currentStreak(streakItems),
      weekMinutes,
      due,
      strength: averageStrength(memoryList),
    };
  }, [memoryList, sessions, attempts]);

  const nearestPlan = useMemo(
    () =>
      [...plans].sort(
        (a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime(),
      )[0],
    [plans],
  );

  const planProgress = useMemo(() => {
    if (!nearestPlan) return null;
    const topics = nearestPlan.days.flatMap((day) => day.topics);
    const done = topics.filter((topic) => topic.status === "done").length;
    return { total: topics.length, done, pct: topics.length ? Math.round((done / topics.length) * 100) : 0 };
  }, [nearestPlan]);

  const recentNotes = useMemo(
    () => [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3),
    [notes],
  );

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const dueTopics = [...stats.due]
    .sort((a, b) => a.strength - b.strength)
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium text-primary">{greeting}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {firstName}, ready for a focused session?
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {stats.due.length > 0
              ? `${stats.due.length} topic${stats.due.length === 1 ? "" : "s"} need attention. Start there.`
              : "Nothing overdue. Pick a space and get ahead."}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/app/chat">
            <Button variant="gradient">
              <MessageSquare className="h-4 w-4" />
              Ask Aeva
            </Button>
          </Link>
          <Button variant="outline" onClick={() => navigate("/app/planner")}>
            <CalendarClock className="h-4 w-4" />
            Plan
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Streak"
          value={`${stats.streak} ${stats.streak === 1 ? "day" : "days"}`}
          hint="Any study activity counts"
          icon={<Flame className="h-5 w-5" />}
        />
        <StatCard
          label="This week"
          value={formatDuration(stats.weekMinutes)}
          hint={`${sessions.length} sessions logged`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Due now"
          value={stats.due.length}
          hint="Weak or scheduled for today"
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard
          label="Memory strength"
          value={`${stats.strength}%`}
          hint={`${memoryList.length} topics tracked`}
          icon={<Brain className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="flex flex-col">
          <div className="flex items-center justify-between border-b border-border/60 p-5 pb-4">
            <SectionHeading title="Today's focus" description="Weakest topics first" />
            <Link
              to="/app/revision"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
            >
              Revision
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex-1 space-y-2.5 p-4">
            {dueTopics.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="h-5 w-5" />}
                title="All caught up"
                description="No topics are due. Generate a quiz or add a new topic to keep momentum."
                action={
                  <Link to="/app/quiz">
                    <Button variant="secondary" size="sm">
                      Make a quiz
                    </Button>
                  </Link>
                }
              />
            ) : (
              dueTopics.map((memory) => (
                <div
                  key={memory.topicId}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[13.5px] font-medium">{memory.topicName}</p>
                      <Badge variant={memory.strength < 50 ? "danger" : "warning"}>
                        {memory.strength}/100
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {reasonFor(memory)}
                    </p>
                    <Progress
                      value={memory.strength}
                      tone={memory.strength < 50 ? "danger" : memory.strength < 75 ? "warning" : "success"}
                      className="mt-2 h-1.5"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate("/app/revision")}
                  >
                    Review
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold">Quick start</p>
            </div>
            <div className="mt-3 grid gap-2">
              {[
                { label: "Generate a quiz", to: "/app/quiz", icon: GraduationCap },
                { label: "Review flashcards", to: "/app/flashcards", icon: Layers },
                { label: "Write a note", to: "/app/notes", icon: NotebookPen },
                { label: "Open exam plan", to: "/app/planner", icon: CalendarClock },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.to}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                  <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-50" />
                </Link>
              ))}
            </div>
          </Card>

          {nearestPlan && planProgress ? (
            <Card className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Next exam
                  </p>
                  <p className="mt-0.5 text-sm font-semibold">{nearestPlan.examName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(`${nearestPlan.examDate}T00:00:00`).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <Badge variant="primary">{planProgress.pct}%</Badge>
              </div>
              <Progress value={planProgress.pct} className="mt-3" />
              <p className="mt-2 text-xs text-muted-foreground">
                {planProgress.done} of {planProgress.total} topics done
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3 w-full"
                onClick={() => navigate(`/app/planner/${nearestPlan.id}`)}
              >
                Continue plan
              </Button>
            </Card>
          ) : null}
        </div>
      </div>

      <div>
        <SectionHeading
          title="Your study spaces"
          description="Everything for a subject in one place."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const id = addSpace({ name: "New space", subject: "General" });
                navigate(`/app/spaces/${id}`);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              New space
            </Button>
          }
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.slice(0, 6).map((space) => {
            const color = spaceColorClasses[space.color] ?? spaceColorClasses.indigo;
            const spaceChats = useStudyStore.getState().chats.filter((chat) => chat.spaceId === space.id);
            const spaceNotes = notes.filter((note) => note.spaceId === space.id);
            const spaceQuizzes = quizzes.filter((quiz) => quiz.spaceId === space.id);
            const spaceDecks = decks.filter((deck) => deck.spaceId === space.id);
            const spaceMemories = memoryList.filter((memory) => memory.spaceId === space.id);
            return (
              <Link key={space.id} to={`/app/spaces/${space.id}`}>
                <Card className="group h-full p-5 transition hover:-translate-y-0.5 hover:border-primary/30">
                  <div className="flex items-center gap-2.5">
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", color?.soft)}>
                      <span className={cn("h-2.5 w-2.5 rounded-full", color?.dot)} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{space.name}</p>
                      <p className="text-[11px] text-muted-foreground">{space.subject}</p>
                    </div>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                    <span className="chip">{spaceChats.length} chats</span>
                    <span className="chip">{spaceNotes.length} notes</span>
                    <span className="chip">{spaceQuizzes.length} quizzes</span>
                    <span className="chip">{spaceDecks.length} decks</span>
                  </div>
                  <p className="mt-3 text-[11.5px] text-muted-foreground">
                    {spaceMemories.length} topics tracked ·{" "}
                    {spaceMemories.filter((memory) => memory.strength < 50).length} weak
                  </p>
                </Card>
              </Link>
            );
          })}
          {spaces.length === 0 ? (
            <EmptyState
              className="sm:col-span-2 lg:col-span-3"
              icon={<Plus className="h-5 w-5" />}
              title="Create your first space"
              description="Group chats, notes, quizzes and decks by subject."
            />
          ) : null}
        </div>
      </div>

      {recentNotes.length > 0 ? (
        <div>
          <SectionHeading
            title="Pick up where you left off"
            action={
              <Link to="/app/notes" className="text-[13px] font-medium text-primary hover:underline">
                All notes
              </Link>
            }
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {recentNotes.map((note) => (
              <Link key={note.id} to={`/app/notes/${note.id}`}>
                <Card className="h-full p-4 transition hover:border-primary/30">
                  <p className="line-clamp-1 text-[13.5px] font-medium">{note.title}</p>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {note.markdown.replace(/[#>*_`]/g, "").slice(0, 110)}
                  </p>
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Edited {formatRelative(note.updatedAt)}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
