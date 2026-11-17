import { useEffect, type ReactNode } from "react";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/toaster";
import { Button } from "@/components/ui";
import { useAuthStore } from "@/store/auth";
import ChatPage from "@/pages/Chat";
import DashboardPage from "@/pages/Dashboard";
import FlashcardsPage from "@/pages/Flashcards";
import LandingPage from "@/pages/Landing";
import LoginPage from "@/pages/Login";
import NotesPage from "@/pages/Notes";
import PlannerPage from "@/pages/Planner";
import QuizPage from "@/pages/Quiz";
import RevisionPage from "@/pages/Revision";
import SettingsPage from "@/pages/Settings";
import SharePage from "@/pages/Share";
import SpaceDetailPage from "@/pages/SpaceDetail";
import SpacesPage from "@/pages/Spaces";
import TopicPracticePage from "@/pages/TopicPractice";

function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">This page took a study break</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The link may be old, or the space was deleted. Head back to your dashboard.
      </p>
      <Button onClick={() => window.location.assign("#/app")}>Back to dashboard</Button>
    </div>
  );
}

export default function App() {
  const hydrate = useAuthStore((state) => state.hydrateFromSupabase);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/share/:token" element={<SharePage />} />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="chat/:chatId" element={<ChatPage />} />
          <Route path="spaces" element={<SpacesPage />} />
          <Route path="spaces/:spaceId" element={<SpaceDetailPage />} />
          <Route path="quiz" element={<QuizPage />} />
          <Route path="quiz/:quizId" element={<QuizPage />} />
          <Route path="flashcards" element={<FlashcardsPage />} />
          <Route path="flashcards/:deckId" element={<FlashcardsPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="notes/:noteId" element={<NotesPage />} />
          <Route path="revision" element={<RevisionPage />} />
          <Route path="planner" element={<PlannerPage />} />
          <Route path="planner/:planId" element={<PlannerPage />} />
          <Route path="planner/:planId/:topicId" element={<TopicPracticePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </HashRouter>
  );
}
