import {
  ArrowRight,
  Brain,
  CalendarClock,
  Check,
  FileText,
  GraduationCap,
  Layers,
  MessageSquare,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui";
import { useThemeStore } from "@/store/theme";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "A tutor that streams",
    body: "Ask anything and watch a structured answer arrive token by token. Stop it, regenerate it, or turn it into notes.",
  },
  {
    icon: FileText,
    title: "Chat with your files",
    body: "Drop in your notes or a reading. Nova answers from the source and cites the page, so you can check it.",
  },
  {
    icon: GraduationCap,
    title: "Quizzes that grade themselves",
    body: "Single choice, multi-select and true/false from any topic, answer or file. Instant marks and an explanation per question.",
  },
  {
    icon: Layers,
    title: "Flashcards for recall",
    body: "Generate a deck, flip, shuffle and rate each card Easy, Medium, Hard or Needs revision.",
  },
  {
    icon: NotebookPen,
    title: "Notes that keep up",
    body: "A markdown editor with a live preview, PDF export and a share link for the study group.",
  },
  {
    icon: CalendarClock,
    title: "A plan for exam day",
    body: "Give Nova the date, subjects and daily hours. Get a day-by-day plan with a lesson, practice and a doubt box per topic.",
  },
];

const LOOP = [
  {
    icon: Zap,
    title: "Learn",
    body: "Ask, read, annotate. Every answer can become a note, quiz or deck without retyping.",
  },
  {
    icon: Brain,
    title: "Test",
    body: "Quizzes and card ratings feed the memory model, not just a scoreboard.",
  },
  {
    icon: CalendarClock,
    title: "Review",
    body: "The revision dashboard tells you what is due and why, in plain language.",
  },
];

export default function LandingPage() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggle);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">StudyBuddy</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition hover:text-foreground">
              Features
            </a>
            <a href="#loop" className="transition hover:text-foreground">
              The study loop
            </a>
            <a href="#revision" className="transition hover:text-foreground">
              Revision
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              <span aria-hidden>{theme === "dark" ? "☀" : "☾"}</span>
            </Button>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                Sign in
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm" variant="gradient">
                Start studying
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-60" />
          <div
            className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]"
            aria-hidden
          />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24 lg:pt-20">
            <div className="animate-fade-up">
              <span className="chip border-primary/25 bg-primary/10 text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                StudyBuddy · powered by Nova
              </span>
              <h1 className="balance mt-5 text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-[56px]">
                Study smarter,
                <br />
                <span className="text-gradient">not longer.</span>
              </h1>
              <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-muted-foreground">
                One place for a streaming tutor, quizzes that mark themselves, flashcards and a
                revision schedule that remembers what you are about to forget.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link to="/login">
                  <Button size="lg" variant="gradient">
                    Start free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline">
                    Try the demo
                  </Button>
                </Link>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
                {["No credit card", "Works offline as a PWA", "Your notes stay yours"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-success" />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div className="relative animate-fade-up lg:animate-fade-in">
              <div className="surface relative z-10 space-y-4 p-4 shadow-lift sm:p-5">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold leading-tight">Nova</p>
                      <p className="text-[11px] text-muted-foreground">Photosynthesis · Biology</p>
                    </div>
                  </div>
                  <span className="chip">Live</span>
                </div>

                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-[13px] leading-relaxed text-primary-foreground">
                  Why does photosynthesis stop when it gets too hot?
                </div>

                <div className="max-w-[92%] space-y-2.5 rounded-2xl rounded-bl-md bg-muted/60 px-3.5 py-3 text-[13px] leading-relaxed">
                  <p className="font-medium">Because the enzymes that fix carbon stop working.</p>
                  <p className="text-muted-foreground">
                    Above roughly 40°C, Rubisco denatures and the stomata close to save water,
                    which also cuts CO₂ supply. Both slow the Calvin cycle before the light
                    reactions are affected.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="chip bg-card">[p. 42]</span>
                    <span className="chip bg-card">OpenStax Biology</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl border border-border/70 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Quiz</p>
                    <p className="mt-1 text-[12.5px] font-medium leading-snug">
                      Where does the Calvin cycle run?
                    </p>
                    <p className="mt-2 text-[11px] text-success">✓ Stroma</p>
                  </div>
                  <div className="rounded-xl border border-border/70 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Next review
                    </p>
                    <p className="mt-1 text-[12.5px] font-medium leading-snug">In 3 days</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">Strength 68 / 100</p>
                  </div>
                </div>
              </div>
              <div
                className="absolute -right-6 -top-6 h-28 w-28 rounded-3xl bg-gradient-to-br from-indigo-500/30 to-violet-500/10 blur-lg"
                aria-hidden
              />
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-border/50 bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Everything in one workspace
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Built around how learning actually sticks
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                Not another chat box. Each feature feeds the next one, and everything you make
                lives in a study space you can come back to.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="surface group p-5 transition hover:-translate-y-0.5 hover:border-primary/30"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <feature.icon className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-4 text-[15px] font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="loop" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                The study loop
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Learn, test, review. Then repeat less than you think.
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                Every quiz score, card rating and confidence check-in updates a memory strength for
                that topic. Nova uses it to decide what to show you next, and tells you why.
              </p>
              <div className="mt-6 flex items-center gap-2 text-[13px] text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-success" />
                Private by default · your data, your workspace
              </div>
            </div>
            <div className="space-y-3">
              {LOOP.map((step, index) => (
                <div key={step.title} className="surface flex items-start gap-4 p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold">
                      <span className="mr-2 text-xs font-mono text-muted-foreground">
                        0{index + 1}
                      </span>
                      {step.title}
                    </p>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="revision" className="border-y border-border/50 bg-muted/20">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Spaced repetition
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                A revision list you can actually trust
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                Weak topics surface first, strong ones wait. Each card shows a concrete reason —
                the quiz you sat, the card you rated, the confidence you logged.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="chip border-danger/30 bg-danger/10 text-danger">
                  Needs revision
                </span>
                <span className="chip border-warning/30 bg-warning/10 text-warning">Due today</span>
                <span className="chip border-success/30 bg-success/10 text-success">Mastered</span>
                <span className="chip">On track</span>
              </div>
            </div>
            <div className="space-y-3">
              {[
                {
                  topic: "Photosynthesis",
                  reason: "You scored 58% on a quiz 3 days ago — a signal to revise.",
                  strength: 46,
                  tone: "danger" as const,
                },
                {
                  topic: "Quadratic equations",
                  reason: "You rated a flashcard Medium yesterday.",
                  strength: 62,
                  tone: "warning" as const,
                },
                {
                  topic: "Cell respiration",
                  reason: "You checked in feeling confident today.",
                  strength: 88,
                  tone: "success" as const,
                },
              ].map((row) => (
                <div key={row.topic} className="surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[14px] font-semibold">{row.topic}</p>
                    <span className="text-xs text-muted-foreground">{row.strength}/100</span>
                  </div>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">{row.reason}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${
                        row.tone === "danger"
                          ? "bg-danger"
                          : row.tone === "warning"
                            ? "bg-warning"
                            : "bg-success"
                      }`}
                      style={{ width: `${row.strength}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="surface relative overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 p-8 text-white sm:p-12">
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight">
                Your next study session starts here.
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/80">
                Pick a subject, ask one question, and let the workspace build itself around what you
                are learning.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/login">
                  <Button size="lg" className="bg-white text-indigo-700 hover:bg-white/90">
                    Start studying free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="border border-white/30 text-white hover:bg-white/10"
                  >
                    Explore the demo
                  </Button>
                </Link>
              </div>
            </div>
            <div
              className="absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-white/10 blur-2xl"
              aria-hidden
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>StudyBuddy — an original study assistant.</span>
          </div>
          <div className="flex gap-5">
            <Link to="/login" className="transition hover:text-foreground">
              Sign in
            </Link>
            <a href="#features" className="transition hover:text-foreground">
              Features
            </a>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
