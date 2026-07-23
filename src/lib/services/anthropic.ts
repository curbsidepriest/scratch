import Anthropic from "@anthropic-ai/sdk";

// One shared client + a small structured-output helper for the three services.
// Reads ANTHROPIC_API_KEY from the environment. The model is configurable via
// ANTHROPIC_MODEL (defaults to Opus 4.8, the most capable); set it to
// claude-haiku-4-5 or claude-sonnet-4-6 to trade quality for cost.

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export function llmEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY && process.env.LLM_STUB !== "1";
}

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";

/**
 * Call Claude and parse a JSON object matching `schema` (structured outputs
 * guarantee valid JSON). `think` turns on adaptive thinking for nuanced
 * judgement; leave it off for mechanical extraction.
 */
export async function structured<T>(opts: {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
  think?: boolean;
}): Promise<T> {
  const params: Record<string, unknown> = {
    model: MODEL,
    max_tokens: opts.maxTokens ?? 8000,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
    output_config: { format: { type: "json_schema", schema: opts.schema } },
  };
  if (opts.think) params.thinking = { type: "adaptive" };

  // Cast: output_config is a current API param that may lead the installed SDK types.
  const res = await getClient().messages.create(
    params as unknown as Parameters<Anthropic["messages"]["create"]>[0],
  );
  const message = res as Anthropic.Message;
  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return JSON.parse(text) as T;
}
