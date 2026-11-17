import { serviceClient } from "./auth.ts";
import { HttpError } from "./http.ts";

const DAILY_BUDGET = Number(Deno.env.get("DAILY_TOKEN_BUDGET") ?? "60000");

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function assertWithinBudget(userId: string): Promise<void> {
  const client = serviceClient();
  const { data, error } = await client
    .from("ai_usage")
    .select("tokens")
    .eq("user_id", userId)
    .eq("day", today())
    .maybeSingle();

  if (error) throw new HttpError(500, "Could not check your AI usage");
  if ((data?.tokens ?? 0) >= DAILY_BUDGET) {
    throw new HttpError(429, "Daily AI limit reached. Try again tomorrow.");
  }
}

export async function recordUsage(userId: string, tokens: number): Promise<void> {
  if (tokens <= 0) return;
  const client = serviceClient();
  const day = today();
  const { data } = await client
    .from("ai_usage")
    .select("tokens")
    .eq("user_id", userId)
    .eq("day", day)
    .maybeSingle();

  const next = (data?.tokens ?? 0) + tokens;
  await client
    .from("ai_usage")
    .upsert({ user_id: userId, day, tokens: next, updated_at: new Date().toISOString() });
}
