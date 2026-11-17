import { z } from "npm:zod@3.23.8";

import { requireUser } from "../_shared/auth.ts";
import { errorResponse, HttpError, json, preflight } from "../_shared/http.ts";
import { webSearch } from "../_shared/search.ts";
import { readJson } from "../_shared/validate.ts";

const requestSchema = z.object({
  query: z.string().min(2).max(400),
  count: z.number().int().min(1).max(8).default(4),
});

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    await requireUser(req);
    const parsed = requestSchema.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, "Invalid search request");

    const sources = await webSearch(parsed.data.query, parsed.data.count);
    if (sources.length === 0) {
      return json({
        sources: [],
        notice: "No search provider configured. Set TAVILY_API_KEY or SEARCH_API_KEY.",
      });
    }
    return json({ sources });
  } catch (error) {
    return errorResponse(error);
  }
});
