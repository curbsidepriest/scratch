import { structured, llmEnabled } from "../anthropic";

// Compress an existing through-line PHRASE into its tiny glanceable title — the
// same "folder tab, not headline" label the ranker now produces alongside new
// candidates. Used to backfill sparks created before titles existed, and as a
// standalone way to (re)derive a title from a phrase. Deliberately narrow: it
// only ever shortens the writer's own words, never invents an idea.

const TITLE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title"],
  properties: { title: { type: "string" } },
} as const;

const RULES = `You compress a writer's through-line phrase into a tiny label, so a shelf of saved threads can be scanned at a glance. You never add ideas — you only shorten the writer's own words.

RULES
- 2 to 4 words, lower-case.
- Usually the two things the thread sits between, joined plainly.
    "speed vs depth"    "ambition and rest"    "work self, home self"
  A single topic word is right when the phrase is about one thing ("attention").
- A folder tab, NOT a headline. Nothing clever, evocative, or essay-title-like
  ("The Cost of Speed" is wrong). No full sentence, no verbs/imperatives, no
  "you", no quotes, no trailing punctuation.
- Use the phrase's own subject words. Do not introduce anything new.`;

/** Strip quotes/trailing punctuation, lower-case, clamp length. */
function normalize(t: string): string {
  return t
    .trim()
    .replace(/^["'`]+/, "")
    .replace(/["'`.!?]+$/, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, 60)
    .trim();
}

const OPENERS =
  /^(there'?s something here about how |there'?s a thread here about |you keep |you'?re |how you keep |the )/i;
const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "for",
  "with", "how", "that", "this", "your", "you", "keep", "circling", "between",
  "against", "about", "something", "there", "gap", "into", "from", "it", "its",
  "pull", "pulling", "sets", "setting", "come", "coming", "back",
]);

/** Deterministic fallback when the LLM is unavailable: salient words, joined. */
function fallback(phrase: string): string {
  const words = phrase
    .replace(OPENERS, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP.has(w));
  const picked = [...new Set(words)].slice(0, 3);
  return picked.length ? picked.join(" ") : "a saved thread";
}

export async function generateTitle(phrase: string): Promise<string> {
  const clean = phrase.trim();
  if (!clean) return "";
  if (!llmEnabled()) return fallback(clean);
  try {
    const { title } = await structured<{ title: string }>({
      system: RULES,
      user: `Phrase:\n${clean}\n\nReturn JSON {"title": "..."} — just the short label.`,
      schema: TITLE_SCHEMA as unknown as Record<string, unknown>,
      maxTokens: 200,
    });
    return normalize(title) || fallback(clean);
  } catch {
    return fallback(clean);
  }
}
