import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * The client only ever holds the public anon key. AI provider keys live in
 * Supabase Edge Function secrets and are never bundled.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    })
  : null;

export const supabaseUrl = url;

export function functionUrl(name: string): string {
  return `${url}/functions/v1/${name}`;
}
