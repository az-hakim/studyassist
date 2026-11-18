import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CalendarClock,
  Check,
  FileText,
  Flame,
  GraduationCap,
  Layers,
  Lightbulb,
  ListChecks,
  MessageSquare,
  NotebookPen,
  Search,
  Share2,
  Sparkles,
  Timer,
} from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui";

const SUBJECTS = [
  "Biology",
  "Calculus",
  "History",
  "Physics",
  "Chemistry",
  "Economics",
  "Literature",
  "Computer Science",
];

const FEATURES = [
  {
    icon: Brain,
    title: "AI Revision Mode",
    body: "Spaced repetition, run by Aeva. Every topic gets a memory-strength score and a review date — your dashboard shows what needs revision, why, and one tap starts a session.",
  },
  {
    icon: CalendarClock,
    title: "AI Exam Prep",
    body: "Tell Aeva which exam, when, and how long you can study each day. It builds a day-by-day plan, then teaches every topic with a lesson, quiz, flashcards and a doubt box.",
  },
  {
    icon: GraduationCap,
    title: "AI Quiz Generator",
    body: "Turn any topic, answer or PDF into a practice quiz — multiple-choice, multi-select and true/false questions with instant grading and feedback.",
  },
  {
    icon: Layers,
    title: "AI Flashcard Generator",
    body: "Auto-generate flashcard decks from responses, PDFs or quizzes. Flip, shuffle, and study with Easy, Medium, Hard or Needs revision ratings.",
  },
  {
    icon: MessageSquare,
    title: "AI Chat Assistant",
    body: "Meet Aeva — your AI tutor for homework help. Ask anything and get clear, streaming answers that pick the right tool automatically.",
  },
  {
    icon: BookOpen,
    title: "Study Spaces",
    body: "Give every subject its own workspace — chats, notes, quizzes, flashcards and files together, with per-space progress and weak-topic tracking.",
  },
  {
    icon: NotebookPen,
    title: "Real Notes Editor",
    body: "Write markdown notes, save any AI answer as a note and refine it, then export to PDF or share with a link.",
  },
  {
    icon: FileText,
    title: "Chat with Your PDFs",
    body: "Upload PDFs, notes and images — Aeva answers from your own material with page-level citations.",
  },
  {
    icon: Search,
    title: "Live Web Search",
    body: "Web-grounded answers with rich source cards, so everything is current and verifiable.",
  },
  {
    icon: Share2,
    title: "Share with Friends",
    body: "Share quizzes, quiz results and notes with a public link — friends can attempt your quiz without an account.",
  },
  {
    icon: BarChart3,
    title: "Learning Analytics",
    body: "Study time, streaks, quiz trends, subject breakdown and achievements — one dashboard for your whole learning life.",
  },
];

const JOURNEY = [
  {
    icon: MessageSquare,
    title: "Chat",
    body: "Ask Aeva anything — from your notes, a PDF, or the live web.",
  },
  {
    icon: Layers,
    title: "Flashcards",
    body: "Turn the answer into a flashcard deck and study it your way.",
  },
  {
    icon: GraduationCap,
    title: "Quiz",
    body: "Generate a quiz on the same material and test yourself.",
  },
  {
    icon: BarChart3,
    title: "Analysis",
    body: "Get AI performance feedback that pinpoints your weak topics.",
  },
  {
    icon: Brain,
    title: "Revise",
    body: "Aeva schedules spaced-repetition reviews so each topic comes back right before you would forget it.",
  },
  {
    icon: Flame,
    title: "Keep the streak",
    body: "Check in with a quick confidence rating, watch your memory strength climb, and build a daily streak.",
  },
];

const REVISION_ROWS = [
  {
    topic: "Photosynthesis — light reactions",
    reason: "You scored 58% on the last quiz — a quick review locks it in.",
    strength: 58,
    tone: "danger" as const,
  },
  {
    topic: "Chemical bonding",
    reason: "You rated these flashcards “Hard” twice in a row.",
    strength: 34,
    tone: "warning" as const,
  },
  {
    topic: "Newton's laws of motion",
    reason: "Mastered · next review in 12 days.",
    strength: 92,
    tone: "success" as const,
  },
];

const FAQS = [
  {
    question: "What is an AI study assistant?",
    answer:
      "An AI study assistant is a learning tool that answers questions, explains concepts, and creates practice material from your own study resources. StudyAssistant combines an AI chat, PDF chat, quiz generator, flashcards, spaced-repetition revision and learning analytics in one free app for students.",
  },
  {
    question: "Is StudyAssistant free?",
    answer:
      "Yes. You can start learning for free, chat with Aeva, generate quizzes and flashcards, and build a revision schedule.",
  },
  {
    question: "Can I upload my notes and ask questions?",
    answer:
      "Yes. Upload PDFs, notes and images and chat with them directly. Aeva retrieves the exact pages that answer your question and cites them, so you can jump straight to the source in your own material.",
  },
  {
    question: "Can AI generate quizzes from PDFs?",
    answer:
      "Yes. Turn any uploaded PDF, note or chat answer into a practice quiz. Pick the topic, difficulty and question types; the quiz is graded instantly and you get feedback on what to revise.",
  },
  {
    question: "Does StudyAssistant help me revise with spaced repetition?",
    answer:
      "Yes. AI Revision Mode tracks a memory-strength score for every topic you study and schedules reviews just before you are likely to forget. After each session a quick confidence check-in reschedules the topic.",
  },
  {
    question: "Does Aeva teach the topics or just plan them?",
    answer:
      "Both. Open any topic on your plan and Aeva writes a full lesson for it — why it matters, core ideas, worked examples, things to remember, common mistakes and a quick self-check. From the same screen you can start a quiz or a flashcard deck and ask doubts in a topic-scoped box.",
  },
  {
    question: "Can I organize my study by subject?",
    answer:
      "Yes. Study Spaces are per-subject workspaces that keep your chats, notes, quizzes, flashcards and files together. Each space tracks its own progress and weak topics.",
  },
  {
    question: "Is my data private?",
    answer:
      "Yes. Your sessions, uploads, quizzes and flashcards are tied to your account and only accessible to you.",
  },
];

export default function LandingPage() {
  const location = useLocation();
  const scrollTo = (location.state as { scrollTo?: string } | null)?.scrollTo;

  useEffect(() => {
    if (!scrollTo) return;
    document.getElementById(scrollTo)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [scrollTo]);

  return (
    <SiteLayout>
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
                Meet Aeva — your AI study buddy
              </span>
              <h1 className="balance mt-5 text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-[56px]">
                Your AI study assistant
                <br />
                <span className="text-gradient">for every subject</span>
              </h1>
              <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-muted-foreground">
                StudyAssistant helps with homework, exam prep and everyday learning: chat with your
                PDFs and notes, search the web, and turn any answer into flashcards, quizzes and
                notes — then Aeva remembers what you studied and tells you exactly what to revise.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link to="/login">
                  <Button size="lg" variant="gradient">
                    Start learning free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button size="lg" variant="outline">
                    Explore features
                  </Button>
                </a>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
                {["No credit card", "Works offline as a PWA", "Your notes stay yours"].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-1.5">
                {SUBJECTS.map((subject) => (
                  <span key={subject} className="chip text-[11.5px] text-muted-foreground">
                    {subject}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative animate-fade-up lg:animate-fade-in">
              <div className="surface relative z-10 space-y-4 p-4 shadow-lift sm:p-5">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold leading-tight">Aeva</p>
                      <p className="text-[11px] text-muted-foreground">School · Biology</p>
                    </div>
                  </div>
                  <span className="chip">Live demo</span>
                </div>

                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-[13px] leading-relaxed text-primary-foreground">
                  Explain photosynthesis with a simple diagram.
                </div>

                <div className="max-w-[92%] space-y-2.5 rounded-2xl rounded-bl-md bg-muted/60 px-3.5 py-3 text-[13px] leading-relaxed">
                  <p>
                    Photosynthesis is how plants turn sunlight into food. It happens in the{" "}
                    <strong>chloroplasts</strong> of leaf cells.
                  </p>
                  <pre className="overflow-x-auto rounded-lg bg-background/70 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
                    {`      Sunlight
         │
         ▼
6CO₂ + 6H₂O ──► C₆H₁₂O₆ + 6O₂
(air)  (roots)   (glucose) (released)`}
                  </pre>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>
                      <strong className="text-foreground">Light reactions</strong> — chlorophyll
                      captures sunlight and splits water
                    </li>
                    <li>
                      <strong className="text-foreground">Calvin cycle</strong> — carbon dioxide is
                      fixed into glucose
                    </li>
                  </ul>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <span className="chip bg-card">Create quiz</span>
                    <span className="chip bg-card">Create flashcards</span>
                    <span className="chip bg-card">Summarize</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Sources used for this answer
                  </p>
                  {[
                    { domain: "khanacademy.org", title: "Photosynthesis — Khan Academy" },
                    { domain: "britannica.com", title: "Photosynthesis | Definition & Process" },
                  ].map((source) => (
                    <div
                      key={source.domain}
                      className="flex items-center gap-2.5 rounded-xl border border-border/70 px-3 py-2"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-[10px] font-semibold text-muted-foreground">
                        {source.domain.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-medium leading-tight">
                          {source.title}
                        </p>
                        <p className="text-[10.5px] text-muted-foreground">{source.domain}</p>
                      </div>
                    </div>
                  ))}
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
                Everything in one place
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                More than a chatbot — a complete learning system
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                Homework help, day-by-day exam plans and spaced-repetition revision — discover,
                learn, save and remember in one place.
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

        <section id="revision" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <span className="chip border-primary/25 bg-primary/10 text-primary">AI Revision Mode</span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                Aeva remembers what you learn — so you don't forget it
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                Most study apps stop at the answer. StudyAssistant tracks a memory strength for every
                topic and builds a daily revision plan around it — what needs revision now, what is
                due today, and what you have recently mastered.
              </p>
              <ul className="mt-5 space-y-2.5 text-[13.5px] text-muted-foreground">
                {[
                  "A review date timed to just before you would forget it.",
                  "Weak topics, with a concrete reason for each one.",
                  "Confidence check-ins that reschedule a topic instantly.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="surface space-y-3 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold">Your revision plan</p>
                <span className="chip border-warning/30 bg-warning/10 text-warning">
                  <Flame className="h-3.5 w-3.5" /> 12-day streak
                </span>
              </div>
              {REVISION_ROWS.map((row) => (
                <div key={row.topic} className="rounded-xl border border-border/70 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13.5px] font-semibold">{row.topic}</p>
                    <span className="text-xs text-muted-foreground">{row.strength}%</span>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                    {row.reason}
                  </p>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
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
                  <div className="mt-2.5 flex gap-1.5">
                    <span className="chip text-[11px]">Revise</span>
                    <span className="chip text-[11px]">Quiz</span>
                    <span className="chip text-[11px]">Flashcards</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border/50 bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="max-w-2xl">
              <span className="chip border-primary/25 bg-primary/10 text-primary">Exam Prep</span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                Aeva plans your exam — and teaches every topic
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                A day-by-day plan built from the official syllabus, a lesson for every topic, and
                practice until it sticks. For school exams, board exams, college and university
                exams, or a single subject test.
              </p>
            </div>

            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: CalendarClock,
                  title: "Plan",
                  body: "Name your exam, its date, your class or stream, subjects and daily study time. Aeva spreads every topic across the days you have.",
                  detail: "Day 3 · Thursday · 2 hrs · Physics: force and laws · Maths: quadratic equations",
                },
                {
                  icon: Lightbulb,
                  title: "Learn",
                  body: "Open a topic and Aeva writes the lesson: why it matters, the core ideas, worked examples, things to remember, common mistakes and a self-check.",
                  detail: "Lesson · Force and laws of motion · 6 sections",
                },
                {
                  icon: ListChecks,
                  title: "Practice",
                  body: "Quiz yourself and flip flashcards on the same topic, ask doubts in a box scoped to it, run the study timer, then mark it done.",
                  detail: "7 of 24 topics done · 29%",
                },
              ].map((step, index) => (
                <div key={step.title} className="surface p-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[12px] font-semibold text-primary-foreground">
                      {index + 1}
                    </span>
                    <step.icon className="h-4 w-4 text-primary" />
                    <p className="text-[14px] font-semibold">{step.title}</p>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                  <p className="mt-3 rounded-lg bg-muted/60 px-2.5 py-2 text-[11.5px] leading-relaxed text-muted-foreground">
                    {step.detail}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-muted-foreground">
              <Timer className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Full preparation for entrance exams such as JEE, NEET or UPSC is not available yet.
            </p>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              The complete learning journey
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              A loop designed to make you actually remember — not just chat. Preparing for an exam?
              Aeva turns the same loop into a day-by-day plan and teaches every topic on it.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {JOURNEY.map((step, index) => (
              <div key={step.title} className="surface flex items-start gap-4 p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.icon className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-[15px] font-semibold">
                    <span className="mr-2 font-mono text-xs text-muted-foreground">
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
        </section>

        <section id="about" className="border-y border-border/50 bg-muted/20">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-20">
            <h2 className="text-3xl font-semibold tracking-tight">What is an AI study assistant?</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              An AI study assistant is a learning tool that uses artificial intelligence to answer
              questions, explain concepts and create practice material from your own study
              resources. Instead of juggling a chatbot, a quiz maker and a flashcard app, you study
              in one connected place.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              StudyAssistant is a free AI study assistant built for students. Its AI study buddy,
              Aeva, answers with live web search and cited sources, reads the PDFs and notes you
              upload, and turns any answer or document into quizzes, flashcards and study plans —
              then tracks your performance and schedules spaced-repetition revision so you review
              the right topic at the right time.
            </p>
            <ul className="mt-6 grid gap-3 text-[13.5px] leading-relaxed text-muted-foreground sm:grid-cols-2">
              {[
                ["Homework help", "clear, step-by-step explanations with cited sources."],
                ["Chat with your PDFs", "answers that cite the exact page of your material."],
                ["Quiz generator", "practice questions with instant grading and feedback."],
                ["Flashcards", "decks from your material, with mastery tracked over time."],
                ["Exam preparation", "a day-by-day plan with a lesson for every topic."],
                ["Spaced repetition", "a review date and a reason for every topic."],
              ].map(([title, body]) => (
                <li key={title}>
                  <strong className="text-foreground">{title}:</strong> {body}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-3xl font-semibold tracking-tight">Frequently asked questions</h2>
          <div className="mt-8 divide-y divide-border/60 border-y border-border/60">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14.5px] font-medium">
                  {faq.question}
                  <span
                    className="text-muted-foreground transition group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="surface relative overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 p-8 text-white sm:p-12">
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight">
                More than an AI chatbot — a complete AI learning system.
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/80">
                Homework help, PDF chat, quizzes, flashcards, study spaces, day-by-day exam plans —
                and spaced-repetition revision that tells you exactly what to review next.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/login">
                  <Button size="lg" className="bg-white text-indigo-700 hover:bg-white/90">
                    Start learning free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="border border-white/30 text-white hover:bg-white/10"
                  >
                    Explore features
                  </Button>
                </a>
              </div>
            </div>
            <div
              className="absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-white/10 blur-2xl"
              aria-hidden
            />
          </div>
        </section>
      </main>

    </SiteLayout>
  );
}
