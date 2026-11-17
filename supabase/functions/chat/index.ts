import { streamModel } from "../_shared/ai.ts";
import { requireUser } from "../_shared/auth.ts";
import { corsHeaders, errorResponse, HttpError, preflight } from "../_shared/http.ts";
import { chatSystemPrompt } from "../_shared/prompts.ts";
import { chatRequestSchema } from "../_shared/schemas.ts";
import { formatSearchContext, webSearch } from "../_shared/search.ts";
import { assertWithinBudget, recordUsage } from "../_shared/usage.ts";
import { readJson } from "../_shared/validate.ts";

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    const { userId } = await requireUser(req);
    await assertWithinBudget(userId);

    const parsed = chatRequestSchema.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, "Invalid chat request");
    const body = parsed.data;

    const lastUserMessage = [...body.messages].reverse().find((message) => message.role === "user");
    if (!lastUserMessage) throw new HttpError(400, "A user message is required");

    let sources: Array<{ title: string; url: string; domain: string }> = [];
    if (body.webSearch) {
      sources = await webSearch(body.topic ?? lastUserMessage.content, 4);
    }

    const system = chatSystemPrompt({
      profile: body.profile,
      chunks: body.chunks ?? [],
      webContext: formatSearchContext(sources),
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (payload: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };

        try {
          if (sources.length > 0) send({ type: "sources", sources });

          const result = await streamModel({
            system,
            messages: body.messages,
            maxTokens: 1600,
            onToken: (token) => send({ type: "token", value: token }),
          });

          send({ type: "done" });
          await recordUsage(userId, result.tokens);
        } catch (error) {
          send({
            type: "error",
            error:
              error instanceof HttpError
                ? error.message
                : "The tutor could not answer right now. Please try again.",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
});
