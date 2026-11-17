import {
  Check,
  Database,
  Download,
  Laptop,
  LogOut,
  MonitorSmartphone,
  Moon,
  RefreshCw,
  Sun,
  Trash2,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  SectionHeading,
  Select,
} from "@/components/ui";
import { downloadTextFile } from "@/lib/export";
import { isSupabaseConfigured, supabaseUrl } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth";
import { reseedDemo, useStudyStore } from "@/store/study";
import { useThemeStore } from "@/store/theme";
import { toast } from "@/store/toast";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const LANGUAGES = ["English", "Hindi", "Bengali", "Spanish", "French", "Arabic", "Portuguese"];

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const signOut = useAuthStore((state) => state.signOut);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  const spaces = useStudyStore((state) => state.spaces);
  const notes = useStudyStore((state) => state.notes);
  const quizzes = useStudyStore((state) => state.quizzes);
  const decks = useStudyStore((state) => state.decks);
  const memories = useStudyStore((state) => state.memories);
  const plans = useStudyStore((state) => state.plans);
  const sessions = useStudyStore((state) => state.sessions);
  const chats = useStudyStore((state) => state.chats);
  const messages = useStudyStore((state) => state.messages);
  const resetAll = useStudyStore((state) => state.resetAll);

  const [name, setName] = useState(user?.name ?? "");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [confirmReseed, setConfirmReseed] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const saveProfile = () => {
    updateProfile({ ...profile, name: name.trim() || user?.name || "Learner" });
    toast("Profile updated. Nova will use it in every prompt.", "success");
  };

  const exportData = () => {
    downloadTextFile(
      `studybuddy-export-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          profile,
          spaces,
          notes,
          quizzes,
          decks,
          memories,
          plans,
          sessions,
          chats,
          messages,
        },
        null,
        2,
      ),
      "application/json",
    );
    toast("Workspace exported.", "success");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your learning profile shapes every answer Nova writes.
        </p>
      </div>

      <Card className="p-5">
        <SectionHeading
          title="Learning profile"
          description="Injected into the system prompt for chat, quizzes, plans and lessons."
          action={<UserRound className="h-4 w-4 text-muted-foreground" />}
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Display name">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Education level">
            <Select
              value={profile.educationLevel}
              onChange={(event) =>
                updateProfile({
                  ...profile,
                  educationLevel: event.target.value as typeof profile.educationLevel,
                })
              }
            >
              <option value="school">School (11–16)</option>
              <option value="high_school">High school (16–18)</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="postgraduate">Postgraduate</option>
              <option value="self_taught">Self-taught</option>
            </Select>
          </Field>
          <Field label="Answer language">
            <Select
              value={profile.language}
              onChange={(event) => updateProfile({ ...profile, language: event.target.value })}
            >
              {LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Explanation style">
            <Select
              value={profile.explanationStyle}
              onChange={(event) =>
                updateProfile({
                  ...profile,
                  explanationStyle: event.target.value as typeof profile.explanationStyle,
                })
              }
            >
              <option value="concise">Concise</option>
              <option value="step_by_step">Step by step</option>
              <option value="eli5">Explain simply</option>
              <option value="exam_focused">Exam focused</option>
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={saveProfile}>
            <Check className="h-4 w-4" />
            Save profile
          </Button>
          <span className="text-[11px] text-muted-foreground">
            Signed in as {user?.email ?? "unknown"} · {user?.isGuest ? "guest" : user?.provider}
          </span>
        </div>
      </Card>

      <Card className="p-5">
        <SectionHeading title="Appearance" description="Theme is stored on this device." />
        <div className="mt-3 flex gap-2">
          <Button
            variant={theme === "light" ? "primary" : "outline"}
            size="sm"
            onClick={() => setTheme("light")}
          >
            <Sun className="h-4 w-4" />
            Light
          </Button>
          <Button
            variant={theme === "dark" ? "primary" : "outline"}
            size="sm"
            onClick={() => setTheme("dark")}
          >
            <Moon className="h-4 w-4" />
            Dark
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <SectionHeading
          title="Backend & AI"
          description="Where your data lives and how answers are produced."
          action={<Database className="h-4 w-4 text-muted-foreground" />}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={isSupabaseConfigured ? "success" : "warning"}>
            {isSupabaseConfigured ? "Supabase connected" : "Demo mode"}
          </Badge>
          {isSupabaseConfigured ? (
            <span className="truncate text-[11px] text-muted-foreground">{supabaseUrl}</span>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              Local accounts, local AI fallback, browser storage only
            </span>
          )}
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          {isSupabaseConfigured
            ? "Chat, structured generation and auth call Supabase Edge Functions. AI keys stay in function secrets, never in this bundle."
            : "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, apply the SQL migrations and deploy the Edge Functions to turn on real accounts, sync, pgvector retrieval and model-generated content. No key is required to use this demo."}
        </p>
      </Card>

      <Card className="p-5">
        <SectionHeading
          title="Install as an app"
          description="StudyBuddy is a PWA: installable, offline shell, home-screen icon."
          action={<MonitorSmartphone className="h-4 w-4 text-muted-foreground" />}
        />
        <div className="mt-3">
          {installPrompt ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await installPrompt.prompt();
                const choice = await installPrompt.userChoice;
                toast(
                  choice.outcome === "accepted" ? "Installing StudyBuddy…" : "Install dismissed.",
                  choice.outcome === "accepted" ? "success" : "info",
                );
                setInstallPrompt(null);
              }}
            >
              <Laptop className="h-4 w-4" />
              Install this app
            </Button>
          ) : (
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Use your browser's install option (Chrome: the icon in the address bar; Safari:
              Share → Add to Home Screen). The app shell is cached for offline use.
            </p>
          )}
        </div>
      </Card>

      <Card className="border-danger/25 p-5">
        <SectionHeading
          title="Your data"
          description="Export, restore the demo workspace, or remove everything on this device."
          action={<TriangleAlert className="h-4 w-4 text-danger" />}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={exportData}>
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setConfirmReseed(true)}>
            <RefreshCw className="h-3.5 w-3.5" />
            Restore demo data
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-danger/30 text-danger"
            onClick={() => setConfirmWipe(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete my data
          </Button>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          Export includes spaces, chats, notes, quizzes, decks, topic memories, plans and sessions.
          Deleting removes them from this browser and signs you out. If Supabase is connected,
          deleting rows there is handled by the app's delete-data flow.
        </p>
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="text-sm font-semibold">Session</p>
          <p className="text-[11.5px] text-muted-foreground">
            {user?.name} · {user?.email}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </Button>
      </Card>

      <Modal
        open={confirmReseed}
        onClose={() => setConfirmReseed(false)}
        title="Restore demo data?"
        description="This replaces everything currently in this workspace with the sample Biology, Maths and History content."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReseed(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                reseedDemo();
                setConfirmReseed(false);
                toast("Demo workspace restored.", "success");
              }}
            >
              Restore
            </Button>
          </>
        }
      />

      <Modal
        open={confirmWipe}
        onClose={() => setConfirmWipe(false)}
        title="Delete all data?"
        description="Spaces, chats, notes, quizzes, decks, plans and revision history on this device will be permanently removed."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmWipe(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                resetAll();
                setConfirmWipe(false);
                await signOut();
                toast("All local study data deleted.", "info");
                navigate("/");
              }}
            >
              Delete everything
            </Button>
          </>
        }
      />
    </div>
  );
}
