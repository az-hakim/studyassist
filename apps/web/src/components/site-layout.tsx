import { ArrowRight, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui";
import { useThemeStore } from "@/store/theme";

const FOOTER_LINKS = [
  { to: "/features", label: "Features" },
  { to: "/about", label: "About" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
];

function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggle = useThemeStore((state) => state.toggle);
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
      <span aria-hidden>{theme === "dark" ? "☀" : "☾"}</span>
    </Button>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">StudyAssistant</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <Link to="/features" className="transition hover:text-foreground">
            Features
          </Link>
          <Link to="/" state={{ scrollTo: "how" }} className="transition hover:text-foreground">
            How it works
          </Link>
          <Link to="/" state={{ scrollTo: "faq" }} className="transition hover:text-foreground">
            FAQ
          </Link>
          <Link to="/about" className="transition hover:text-foreground">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              Sign in
            </Button>
          </Link>
          <Link to="/login">
            <Button size="sm" variant="gradient">
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 text-[13px] text-muted-foreground sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-[14px] font-semibold text-foreground">StudyAssistant</span>
            </div>
            <p className="mt-1.5">The free AI study assistant for students.</p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="transition hover:text-foreground">
                {link.label}
              </Link>
            ))}
            <a href="mailto:support@studyassistant.in" className="transition hover:text-foreground">
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-background">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
