import type {
  BlockForGap,
  GapFlag,
  LintCandidate,
  LinterService,
} from "./types";

// Deterministic linter stub (spec §8b/§8c). Simple heuristics that model the
// SHAPE of the real thing: it surfaces specific, local observations and never
// supplies a fix. Swap for a real model via getLinterService() later.

const EXAMPLE_HINTS = ["example", "anecdote", "story", "illustration", "scene"];
const CLAIM_HINTS = ["argument", "claim", "thesis", "point", "case", "why"];

// Assertions that tend to lean on the reader agreeing without support.
const UNSUPPORTED = [
  "obviously",
  "clearly",
  "everyone knows",
  "the truth is",
  "of course",
  "needless to say",
  "it's well known",
];
const HEDGES = ["maybe", "perhaps", "i think", "i guess", "sort of", "kind of", "probably"];

function wordCount(text: string): number {
  const t = text.trim();
  return t === "" ? 0 : t.split(/\s+/).length;
}

function hasAny(text: string, needles: string[]): boolean {
  const n = text.toLowerCase();
  return needles.some((w) => n.includes(w));
}

export class StubLinterService implements LinterService {
  async findGaps(blocks: BlockForGap[]): Promise<GapFlag[]> {
    const gaps: GapFlag[] = [];
    for (const b of blocks) {
      const empty = !b.filled && (b.body ?? "").trim() === "";
      const label = b.label.toLowerCase();
      if (empty && hasAny(label, EXAMPLE_HINTS)) {
        gaps.push({ blockId: b.id, reason: "no example here yet" });
      } else if (empty && hasAny(label, CLAIM_HINTS)) {
        gaps.push({ blockId: b.id, reason: "this claim still needs support" });
      }
    }
    return gaps;
  }

  async lint(draft: string): Promise<LintCandidate[]> {
    // Quiet until there's enough to react to (spec §8c).
    if (wordCount(draft) < 30) return [];

    const paragraphs = draft.split(/\n{2,}/);
    const flags: LintCandidate[] = [];

    paragraphs.forEach((para, i) => {
      const text = para.trim();
      const words = wordCount(text);
      if (words < 12) return; // don't flag fragments

      const range = JSON.stringify({ para: i });
      if (hasAny(text, UNSUPPORTED)) {
        flags.push({
          range,
          quote: text,
          reason: "you state this as given — does it need support?",
        });
      } else if (words > 70) {
        flags.push({
          range,
          quote: text,
          reason: "this paragraph runs long — is it doing one thing?",
        });
      } else {
        const hedgeCount = HEDGES.filter((h) => text.toLowerCase().includes(h)).length;
        if (hedgeCount >= 2) {
          flags.push({
            range,
            quote: text,
            reason: "a lot of hedging here — what are you actually claiming?",
          });
        }
      }
    });

    return flags;
  }
}
