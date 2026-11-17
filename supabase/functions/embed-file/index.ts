import { z } from "npm:zod@3.23.8";

import { requireUser } from "../_shared/auth.ts";
import { errorResponse, HttpError, json, preflight } from "../_shared/http.ts";
import { readJson } from "../_shared/validate.ts";

const requestSchema = z.object({
  fileId: z.string().uuid(),
  chunks: z
    .array(z.object({ page: z.number().int().min(1).max(10_000), text: z.string().min(1).max(8000) }))
    .min(1)
    .max(400),
});

async function embed(texts: string[]): Promise<number[][]> {
  const key = Deno.env.get("EMBEDDING_API_KEY") ?? Deno.env.get("AI_API_KEY");
  if (!key) throw new HttpError(503, "Embeddings are not configured. Add EMBEDDING_API_KEY.");

  const response = await fetch(
    `${Deno.env.get("EMBEDDING_BASE_URL") ?? "https://api.openai.com/v1"}/embeddings`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: Deno.env.get("EMBEDDING_MODEL") ?? "text-embedding-3-small",
        input: texts,
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new HttpError(502, `Embedding provider error: ${detail.slice(0, 160)}`);
  }

  const payload = (await response.json()) as {
    data?: Array<{ embedding: number[] }>;
  };
  const vectors = (payload.data ?? []).map((item) => item.embedding);
  if (vectors.length !== texts.length) throw new HttpError(502, "Incomplete embedding response");
  return vectors;
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    const { userId, client } = await requireUser(req);
    const parsed = requestSchema.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, "Invalid embed request");
    const { fileId, chunks } = parsed.data;

    // RLS guarantees this file belongs to the caller.
    const { data: file, error } = await client
      .from("files")
      .select("id, pages")
      .eq("id", fileId)
      .maybeSingle();

    if (error || !file) throw new HttpError(404, "File not found");

    const vectors = await embed(chunks.map((chunk) => chunk.text));

    await client.from("file_chunks").delete().eq("file_id", fileId);
    const rows = chunks.map((chunk, index) => ({
      user_id: userId,
      file_id: fileId,
      page: chunk.page,
      content: chunk.text,
      embedding: vectors[index],
    }));

    const { error: insertError } = await client.from("file_chunks").insert(rows);
    if (insertError) throw new HttpError(500, "Could not store embeddings");

    const pages = Math.max(...chunks.map((chunk) => chunk.page));
    await client.from("files").update({ pages }).eq("id", fileId);

    return json({ inserted: rows.length, pages });
  } catch (error) {
    return errorResponse(error);
  }
});
