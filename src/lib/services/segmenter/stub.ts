import type {
  SegmentResult,
  SegmentedSnippet,
  SegmenterService,
} from "./types";

// Deterministic segmenter stub. Stands in for the real model's conservative
// GEM extraction (spec §3): it does NOT partition the session into paragraphs —
// it scores sentences with a few crude "gem-likeness" signals and lifts out only
// the standouts (capped low), verbatim. Often that means zero. This can only
// ever be a rough approximation; true judgment lives in the Anthropic segmenter.

const STOPWORDS = new Set([
  "about", "after", "again", "against", "their", "there", "these", "thing",
  "things", "think", "this", "that", "with", "would", "could", "should",
  "from", "have", "here", "just", "keep", "like", "more", "much", "into",
  "over", "then", "them", "they", "were", "what", "when", "which", "while",
  "your", "youre", "been", "being", "because", "back", "still", "some", "very",
  "also", "even", "only", "than", "know", "dont", "cant", "wont", "isnt",
  "time", "come", "goes", "going", "gets", "make", "made", "want", "need",
  "work", "each", "other", "down", "onto", "upon", "really", "actually",
]);

// Crude proxies for "this reads like a gem": contrast/inversion turns, and
// insight framings. The real model judges this; the stub just approximates.
const GEM_MARKERS = [
  " but ", " not ", " isn't ", " isnt ", " never ", " actually ", " really ",
  " the point is", " the truth is", " turns out", " vs ", " versus ",
  " instead of ", " rather than ", " the real ", " what if", " maybe ",
];

const MAX_GEMS = 3;

function salientTerms(text: string, n: number): string[] {
  const counts = new Map<string, number>();
  for (const w of text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)) {
    if (w.length >= 4 && !STOPWORDS.has(w)) {
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}

function labelFor(text: string): string {
  const terms = salientTerms(text, 3);
  if (terms.length > 0) return terms.join(", ");
  return text.trim().split(/\s+/).slice(0, 5).join(" ").toLowerCase();
}

function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Score a sentence for gem-likeness. Higher = more likely a standout. The
// threshold is deliberately high so most sentences score 0 and are left in the
// session, matching the conservative real behavior.
function gemScore(sentence: string): number {
  const words = sentence.split(/\s+/).length;
  // Too short to be an idea, or a runaway ramble: not a clean gem.
  if (words < 5 || words > 40) return 0;
  const lower = ` ${sentence.toLowerCase()} `;
  let score = 0;
  for (const m of GEM_MARKERS) if (lower.includes(m)) score += 1;
  // A punchy, self-contained line (short but not tiny) gets a small nudge.
  if (words <= 16) score += 1;
  return score;
}

export class StubSegmenterService implements SegmenterService {
  async segment(text: string): Promise<SegmentResult> {
    const scored = sentences(text)
      .map((content) => ({ content, score: gemScore(content) }))
      .filter((s) => s.score >= 2) // conservative: needs real signal
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_GEMS);

    const snippets: SegmentedSnippet[] = scored.map(({ content }) => ({
      content,
      label: labelFor(content),
    }));

    // Zero gems is a valid, common result — the raw session is preserved as the
    // scratch, so we never pad the library with the whole text.
    return {
      scratchLabel: labelFor(text),
      snippets,
    };
  }
}
