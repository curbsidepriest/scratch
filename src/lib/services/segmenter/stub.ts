import type {
  SegmentResult,
  SegmentedSnippet,
  SegmenterService,
} from "./types";

// Deterministic segmenter stub. Splits on blank lines; if a stream-of-
// consciousness has none, groups sentences into paragraph-sized chunks. Labels
// are a boring descriptive handle built from the most salient words — a stand-in
// for the real model's "non-poetic summary". Content is always verbatim.

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

const SENTENCES_PER_CHUNK = 3;

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
  // Fallback: first few words, lowercased.
  return text.trim().split(/\s+/).slice(0, 5).join(" ").toLowerCase();
}

function splitParagraphs(text: string): string[] {
  const byBlankLine = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (byBlankLine.length >= 2) return byBlankLine;

  // No paragraph breaks (typical of a dump) — group sentences into chunks.
  const sentences = text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);
  if (sentences.length <= 1) return [text.trim()].filter((t) => t.length > 0);

  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += SENTENCES_PER_CHUNK) {
    chunks.push(sentences.slice(i, i + SENTENCES_PER_CHUNK).join(" "));
  }
  return chunks;
}

export class StubSegmenterService implements SegmenterService {
  async segment(text: string): Promise<SegmentResult> {
    const paragraphs = splitParagraphs(text);
    const snippets: SegmentedSnippet[] = paragraphs.map((content) => ({
      content,
      label: labelFor(content),
    }));
    return {
      scratchLabel: labelFor(text),
      snippets: snippets.length > 0 ? snippets : [{ content: text.trim(), label: labelFor(text) }],
    };
  }
}
