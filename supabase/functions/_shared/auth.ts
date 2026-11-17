import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

import { HttpError } from "./http.ts";

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new HttpError(500, `Missing server configuration: ${name}`);
  return value;
}

export function serviceClient(): SupabaseClient {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface AuthedRequest {
  userId: string;
  email: string | null;
  client: SupabaseClient;
}

/**
 * Verifies the caller's Supabase JWT. The client is created with the caller's
 * own access token, so every query also goes through RLS.
 */
export async function requireUser(req: Request): Promise<AuthedRequest> {
  const header = req.headers.get("Authorization") ?? "";
  if (!header.startsWith("Bearer ")) {
    throw new HttpError(401, "Sign in to use this feature");
  }

  const client = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: header } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    throw new HttpError(401, "Your session expired. Sign in again.");
  }

  return { userId: data.user.id, email: data.user.email ?? null, client };
}
