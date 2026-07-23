import type {
  BlockForGap,
  GapFlag,
  LintCandidate,
  LinterService,
} from "./types";
import { SYSTEM_PROMPT } from "./prompt";
import { structured } from "../anthropic";

// The real Linter. Surfaces gaps in the Architect skeleton and inline issues in
// the Editor draft. Never supplies a fix (SYSTEM_PROMPT enforces the voice).

const GAPS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["gaps"],
  properties: {
    gaps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["blockId", "reason"],
        properties: {
          blockId: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
  },
} as const;

const FLAGS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["flags"],
  properties: {
    flags: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["quote", "reason"],
        properties: {
          quote: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
  },
} as const;

function wordCount(t: string): number {
  const s = t.trim();
  return s === "" ? 0 : s.split(/\s+/).length;
}

export class AnthropicLinterService implements LinterService {
  async findGaps(blocks: BlockForGap[]): Promise<GapFlag[]> {
    if (blocks.length === 0) return [];
    const rendered = blocks
      .map(
        (b) =>
          `[${b.id}] "${b.label}" — ${b.filled ? "filled" : "empty"}${
            b.body ? `; notes: ${b.body}` : ""
          }`,
      )
      .join("\n");
    const { gaps } = await structured<{ gaps: GapFlag[] }>({
      system:
        "You review a writer's outline (blocks). Surface gaps only — a block " +
        "that promises an example but has none, a claim with no support. One " +
        "short observation per gap, referencing the block id. Never fill it. " +
        "Return an empty array if nothing is missing.",
      user: rendered,
      schema: GAPS_SCHEMA as unknown as Record<string, unknown>,
      maxTokens: 2000,
    });
    const ids = new Set(blocks.map((b) => b.id));
    return gaps.filter((g) => ids.has(g.blockId));
  }

  async lint(draft: string): Promise<LintCandidate[]> {
    if (wordCount(draft) < 30) return []; // stay quiet until there's enough
    const { flags } = await structured<{ flags: { quote: string; reason: string }[] }>({
      system: SYSTEM_PROMPT,
      user:
        "Lint this draft. For each issue, quote the exact span it applies to " +
        "(verbatim from the draft) and give one concrete observation of what's " +
        "off — never a rewrite. Skip fragments. Return an empty array if it " +
        "reads clean.\n\n" +
        draft,
      schema: FLAGS_SCHEMA as unknown as Record<string, unknown>,
      maxTokens: 4000,
    });
    // Keep only quotes that actually appear in the draft (guard hallucination).
    return flags
      .filter((f) => f.quote && draft.includes(f.quote.slice(0, 40)))
      .map((f) => ({ range: JSON.stringify({ quote: f.quote }), reason: f.reason, quote: f.quote }));
  }
}
