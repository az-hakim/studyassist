import { ArrowLeft, Check, Loader2, Mail, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { Button, Input } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "@/store/toast";
import { useAuthStore } from "@/store/auth";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.86c2.26-2.09 3.56-5.17 3.56-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A11.99 11.99 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const signInDemo = useAuthStore((state) => state.signInDemo);
  const signInGuest = useAuthStore((state) => state.signInGuest);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const sendMagicLink = useAuthStore((state) => state.sendMagicLink);

  const [email, setEmail] = useState("");
  const [pending, setPending] = useState<"google" | "email" | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/app" replace />;
  }

  const handleEmail = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setPending("email");
    if (isSupabaseConfigured) {
      const message = await sendMagicLink(email);
      if (message) setError(message);
      else setSent(true);
    } else {
      signInDemo(email);
      toast("Signed in to the local demo workspace.", "success");
      navigate("/app");
    }
    setPending(null);
  };

  const handleGoogle = async () => {
    setError(null);
    setPending("google");
    const message = await signInWithGoogle();
    if (message) {
      setError(message);
      setPending(null);
    }
  };

  const handleGuest = () => {
    signInGuest();
    toast("Guest workspace ready. Everything is stored in this browser.", "info");
    navigate("/app");
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative hidden overflow-hidden border-r border-border/60 bg-muted/20 p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-60" />
        <div
          className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-indigo-500/20 blur-[110px]"
          aria-hidden
        />
        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">StudyBuddy</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            “I stopped re-reading and started asking better questions.”
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Revision used to mean flipping through everything. Now the dashboard tells me exactly
            what is due, and the quiz explanations tell me why I missed it.
          </p>
          <div className="mt-6 space-y-2.5 text-[13.5px] text-muted-foreground">
            {[
              "Streaming tutor with page citations",
              "Quizzes and flashcards from your own material",
              "A revision schedule per topic, with reasons",
            ].map((item) => (
              <p key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                {item}
              </p>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-muted-foreground">
          Original product · no copied assets or copy.
        </p>
      </div>

      <div className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to pick up your spaces, notes and revision schedule.
          </p>

          {!isSupabaseConfigured ? (
            <div className="mt-5 rounded-xl border border-warning/25 bg-warning/10 px-3.5 py-3 text-[12.5px] leading-relaxed">
              <span className="font-semibold text-warning">Demo mode.</span> Supabase is not
              configured, so accounts run locally in this browser. Everything works — chat, quizzes,
              notes and revision.
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogle}
              loading={pending === "google"}
              disabled={pending !== null}
            >
              {pending === "google" ? null : <GoogleMark />}
              Continue with Google
            </Button>

            <div className="relative py-1 text-center">
              <span className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden />
              <span className="relative bg-background px-3 text-[11px] uppercase tracking-wide text-muted-foreground">
                or with email
              </span>
            </div>

            <form onSubmit={handleEmail} className="space-y-2.5">
              <label htmlFor="login-email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@school.edu"
                  className="pl-9"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                loading={pending === "email"}
                disabled={pending !== null}
              >
                {sent ? "Send another link" : "Email me a magic link"}
              </Button>
            </form>

            {sent ? (
              <p className="rounded-xl border border-success/25 bg-success/10 px-3 py-2.5 text-[12.5px] text-foreground">
                Check your inbox — the link signs you in and returns you here.
              </p>
            ) : null}

            {error ? (
              <p className="rounded-xl border border-danger/25 bg-danger/10 px-3 py-2.5 text-[12.5px] text-foreground">
                {error}
              </p>
            ) : null}

            <div className="relative py-1 text-center">
              <span className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden />
              <span className="relative bg-background px-3 text-[11px] uppercase tracking-wide text-muted-foreground">
                or look around
              </span>
            </div>

            <Button variant="secondary" className="w-full" onClick={handleGuest}>
              Continue as guest
            </Button>
            <p className="text-center text-[11.5px] leading-relaxed text-muted-foreground">
              Guests get the full demo workspace saved in this browser. Sign in later to keep it
              separate.
            </p>
          </div>

          {pending === "google" ? (
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Waiting for the provider…
            </p>
          ) : null}

          <p className="mt-8 text-center text-[11px] leading-relaxed text-muted-foreground">
            By continuing you agree to use StudyBuddy for your own study. Upload only material you
            have the right to use.
          </p>
        </div>
      </div>
    </div>
  );
}
