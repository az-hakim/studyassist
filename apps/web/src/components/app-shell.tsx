import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Brain,
  CalendarClock,
  ChevronDown,
  Flame,
  GraduationCap,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  NotebookPen,
  Plus,
  Settings,
  Sparkles,
  Sun,
  X,
} from "lucide-react";

import { Button, Modal } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useStudyStore } from "@/store/study";
import { useThemeStore } from "@/store/theme";
import { currentStreak } from "@/lib/stats";
import { initials } from "@studybuddy/shared";

const NAV_ITEMS = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/chat", label: "Chat", icon: MessageSquare },
  { to: "/app/spaces", label: "Study spaces", icon: BookOpen },
  { to: "/app/quiz", label: "Quizzes", icon: GraduationCap },
  { to: "/app/flashcards", label: "Flashcards", icon: Layers },
  { to: "/app/notes", label: "Notes", icon: NotebookPen },
  { to: "/app/revision", label: "Revision", icon: Brain },
  { to: "/app/planner", label: "Exam planner", icon: CalendarClock },
];

const MOBILE_NAV = [
  { to: "/app", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/app/chat", label: "Chat", icon: MessageSquare },
  { to: "/app/quiz", label: "Quiz", icon: GraduationCap },
  { to: "/app/revision", label: "Revise", icon: Brain },
  { to: "/app/notes", label: "Notes", icon: NotebookPen },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/app" className="flex items-center gap-2.5" aria-label="StudyAssistant dashboard">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lift">
        <Sparkles className="h-4.5 w-4.5 text-white" strokeWidth={2} />
      </span>
      {!compact ? (
        <span className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-tight">StudyAssistant</span>
          <span className="block text-[11px] text-muted-foreground">with Aeva</span>
        </span>
      ) : null}
    </Link>
  );
}

function StreakChip() {
  const memories = useStudyStore((state) => state.memories);
  const sessions = useStudyStore((state) => state.sessions);
  const attempts = useStudyStore((state) => state.attempts);
  const items = [
    ...Object.values(memories).map((memory) => ({ at: memory.lastStudiedAt })),
    ...sessions.map((session) => ({ at: session.createdAt })),
    ...attempts.map((attempt) => ({ at: attempt.createdAt })),
  ];
  const streak = currentStreak(items);

  return (
    <span className="chip border-warning/30 bg-warning/10 text-warning">
      <Flame className="h-3.5 w-3.5" aria-hidden />
      <span className="font-semibold text-foreground">{streak}</span>
      <span className="hidden sm:inline">day streak</span>
    </span>
  );
}

function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggle = useThemeStore((state) => state.toggle);
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Light theme" : "Dark theme"}
    >
      {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
    </Button>
  );
}

function UserCard({ onNavigate }: { onNavigate?: () => void }) {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-border/70 bg-card p-2 text-left transition hover:bg-muted/60"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-semibold text-primary">
          {initials(user.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium">{user.name}</span>
          <span className="block truncate text-[11px] text-muted-foreground">
            {user.isGuest ? "Guest session" : user.email}
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-30 mb-2 w-full overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lift"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
            onClick={() => {
              setOpen(false);
              onNavigate?.();
              navigate("/app/settings");
            }}
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            Settings
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
            onClick={async () => {
              setOpen(false);
              onNavigate?.();
              await signOut();
              navigate("/");
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const addSpace = useStudyStore((state) => state.addSpace);
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");

  const create = () => {
    const id = addSpace({ name: name || "New space", subject: subject || name || "General" });
    setCreating(false);
    setName("");
    setSubject("");
    onNavigate?.();
    navigate(`/app/spaces/${id}`);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <Logo />
      </div>

      <nav className="flex-1 space-y-0.5" aria-label="Main">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors",
                isActive
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )
            }
          >
            <item.icon className="h-4 w-4" strokeWidth={1.9} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 border-t border-border/60 pt-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => setCreating(true)}
        >
          <Plus className="h-4 w-4" />
          New study space
        </Button>

        {!isSupabaseConfigured ? (
          <div className="rounded-xl border border-warning/25 bg-warning/10 p-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-warning">Demo mode.</span> Data is saved in this
            browser. Add Supabase keys for accounts and sync.
          </div>
        ) : null}

        <UserCard onNavigate={onNavigate} />
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New study space"
        description="A space keeps its chats, notes, quizzes and decks together."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={create} disabled={name.trim().length === 0}>
              Create space
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="space-name">
              Name
            </label>
            <input
              id="space-name"
              className="field-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Organic chemistry"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="space-subject">
              Subject
            </label>
            <input
              id="space-subject"
              className="field-input"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="e.g. Chemistry"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function AppShell() {
  const [drawer, setDrawer] = useState(false);

  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-border/60 bg-background/80 p-4 backdrop-blur lg:flex">
        <Sidebar />
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setDrawer(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="lg:hidden">
            <Logo compact />
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <StreakChip />
            <ThemeToggle />
            <Link
              to="/app/settings"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-xs font-semibold text-foreground lg:hidden"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 lg:px-8 lg:pb-14">
          <Outlet />
        </main>
      </div>

      <nav
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur lg:hidden"
        aria-label="Primary"
      >
        <div className="flex items-stretch justify-around">
          {MOBILE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[10.5px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )
              }
            >
              <item.icon className="h-5 w-5" strokeWidth={1.9} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {drawer ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setDrawer(false)}
            aria-hidden
          />
          <div className="relative h-full w-[290px] animate-fade-in border-r border-border bg-background p-4">
            <div className="mb-2 flex justify-end">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDrawer(false)}
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      ) : null}

    </div>
  );
}
