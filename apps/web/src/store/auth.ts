import type { LearningProfile } from "@studybuddy/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { supabase } from "@/lib/supabase";
import { newId } from "@/lib/utils";
import type { ProfileSettings, User } from "./types";

interface AuthState {
  user: User | null;
  profile: ProfileSettings;
  signInDemo: (email: string, name?: string) => void;
  signInGuest: (name?: string) => void;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<ProfileSettings> & { name?: string }) => void;
  signInWithGoogle: () => Promise<string | null>;
  sendMagicLink: (email: string) => Promise<string | null>;
  hydrateFromSupabase: () => Promise<void>;
}

const DEFAULT_PROFILE: ProfileSettings = {
  educationLevel: "high_school",
  language: "English",
  explanationStyle: "step_by_step",
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: DEFAULT_PROFILE,

      signInDemo: (email, name) =>
        set({
          user: {
            id: `demo_${email.toLowerCase()}`,
            email,
            name: name?.trim() || email.split("@")[0] || "Learner",
            isGuest: false,
            provider: "demo",
          },
        }),

      signInGuest: (name) =>
        set({
          user: {
            id: newId("guest"),
            email: "guest@local",
            name: name?.trim() || "Guest learner",
            isGuest: true,
            provider: "demo",
          },
        }),

      signOut: async () => {
        if (supabase) await supabase.auth.signOut();
        set({ user: null });
      },

      updateProfile: (patch) => {
        const { name, ...profilePatch } = patch;
        const user = get().user;
        set({
          profile: { ...get().profile, ...profilePatch },
          user: user && name ? { ...user, name } : user,
        });
      },

      signInWithGoogle: async () => {
        if (!supabase) return "Google sign-in needs Supabase credentials. Continue as a guest to explore.";
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/#/app` },
        });
        return error?.message ?? null;
      },

      sendMagicLink: async (email) => {
        if (!supabase) return "Magic links need Supabase credentials. Continue as a guest to explore.";
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/#/app` },
        });
        return error?.message ?? null;
      },

      hydrateFromSupabase: async () => {
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        const authUser = data.session?.user;
        if (!authUser) return;
        set({
          user: {
            id: authUser.id,
            email: authUser.email ?? "",
            name:
              (authUser.user_metadata?.full_name as string | undefined) ??
              authUser.email?.split("@")[0] ??
              "Learner",
            isGuest: false,
            provider: "supabase",
          },
        });
      },
    }),
    {
      name: "studybuddy.auth.v1",
      version: 1,
      partialize: (state) => ({ user: state.user, profile: state.profile }),
    },
  ),
);

export function learningProfile(name: string, profile: ProfileSettings): LearningProfile {
  return {
    displayName: name || "Learner",
    educationLevel: profile.educationLevel,
    language: profile.language,
    explanationStyle: profile.explanationStyle,
  };
}

export function useLearningProfile(): LearningProfile {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  return learningProfile(user?.name ?? "Learner", profile);
}
