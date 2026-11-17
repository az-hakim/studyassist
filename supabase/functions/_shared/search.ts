export interface SearchResult {
  title: string;
  url: string;
  domain: string;
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

/**
 * Pluggable web search. Tavily is used when TAVILY_API_KEY is set, otherwise
 * Brave Search via SEARCH_API_KEY. Without a key the caller simply proceeds
 * without web grounding.
 */
export async function webSearch(query: string, count = 4): Promise<SearchResult[]> {
  const tavilyKey = Deno.env.get("TAVILY_API_KEY");
  const braveKey = Deno.env.get("SEARCH_API_KEY");

  if (tavilyKey) {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyKey,
        query,
        max_results: count,
        search_depth: "basic",
      }),
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as {
      results?: Array<{ title?: string; url?: string }>;
    };
    return (payload.results ?? [])
      .filter((result) => result.url)
      .map((result) => ({
        title: result.title ?? result.url ?? "Source",
        url: result.url ?? "",
        domain: domainOf(result.url ?? ""),
      }));
  }

  if (braveKey) {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`,
      { headers: { Accept: "application/json", "X-Subscription-Token": braveKey } },
    );
    if (!response.ok) return [];
    const payload = (await response.json()) as {
      web?: { results?: Array<{ title?: string; url?: string }> };
    };
    return (payload.web?.results ?? [])
      .filter((result) => result.url)
      .map((result) => ({
        title: result.title ?? result.url ?? "Source",
        url: result.url ?? "",
        domain: domainOf(result.url ?? ""),
      }));
  }

  return [];
}

export function formatSearchContext(results: SearchResult[]): string {
  if (results.length === 0) return "";
  return results
    .map((result, index) => `[${index + 1}] ${result.title} (${result.domain}) — ${result.url}`)
    .join("\n");
}
