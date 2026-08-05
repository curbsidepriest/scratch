import type {
  RankerCandidate,
  RankerRelevance,
  RankerService,
  RankerSnippet,
} from "./types";
import { SYSTEM_PROMPT } from "./prompt";
import { structured } from "../anthropic";

// The real Ranker. Uses SYSTEM_PROMPT (the friend-not-author voice) + adaptive
// thinking for the aliveness judgement. Returns 0..1 candidate, territory not a
// title, evidence pointing at the writer's own snippets.

const CANDIDATE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["candidate"],
  properties: {
    candidate: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: ["phrase", "evidence"],
          properties: {
            phrase: { type: "string" },
            evidence: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["snippetId", "observation"],
                properties: {
                  snippetId: { type: "string" },
                  observation: { type: "string" },
                },
              },
            },
          },
        },
      ],
    },
  },
} as const;

const RELEVANCE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["relevance"],
  properties: {
    relevance: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["snippetId", "suggested", "reason"],
        properties: {
          snippetId: { type: "string" },
          suggested: { type: "boolean" },
          reason: { type: "string" },
        },
      },
    },
  },
} as const;

function renderSnippets(snippets: RankerSnippet[]): string {
  return snippets
    .map((s) => `[${s.id}] (${s.sourceMode}) ${s.content}`)
    .join("\n\n");
}

export class AnthropicRankerService implements RankerService {
  async evaluate(snippets: RankerSnippet[]): Promise<RankerCandidate | null> {
    if (snippets.length < 2) return null;
    const { candidate } = await structured<{ candidate: RankerCandidate | null }>({
      system: SYSTEM_PROMPT,
      user:
        "Here are the writer's snippets, each tagged with its [id]. Look for ONE " +
        "real theme forming across them.\n\n" +
        "Return JSON. If nothing genuine stands out, return {\"candidate\": null}. " +
        "When a real thread is forming, return {\"candidate\": {\"phrase\": ..., " +
        "\"evidence\": [{\"snippetId\": ..., \"observation\": ...}, ...]}}:\n" +
        "- phrase: name the theme plainly and concretely, as in your instructions " +
        "(the two things it circles) — never a title.\n" +
        "- evidence: 2 to 4 items, each citing a real [id] below with a short, " +
        "grounded reason it belongs. Do not invent recurrence or contrast that " +
        "isn't actually in these snippets.\n\n" +
        renderSnippets(snippets),
      schema: CANDIDATE_SCHEMA as unknown as Record<string, unknown>,
      maxTokens: 4000,
      think: true,
    });
    // Guard against hallucinated snippet ids.
    if (candidate) {
      const ids = new Set(snippets.map((s) => s.id));
      candidate.evidence = candidate.evidence.filter((e) => ids.has(e.snippetId));
    }
    return candidate;
  }

  async rankRelevance(
    anchorSnippetIds: string[],
    snippets: RankerSnippet[],
  ): Promise<RankerRelevance[]> {
    const { relevance } = await structured<{ relevance: RankerRelevance[] }>({
      system:
        "You help a writer pull relevant snippets into a piece. Given the " +
        "snippets the through-line was anchored on, judge which of the other " +
        "snippets genuinely relate. Mark `suggested: true` only for real " +
        "relevance; give a short plain reason. Return an entry for every snippet.",
      user:
        `Anchor snippet ids: ${anchorSnippetIds.join(", ") || "(none)"}\n\n` +
        renderSnippets(snippets),
      schema: RELEVANCE_SCHEMA as unknown as Record<string, unknown>,
      maxTokens: 4000,
    });
    const byId = new Map(relevance.map((r) => [r.snippetId, r]));
    // Ensure full coverage; anchors are always suggested.
    return snippets.map((s) => {
      if (anchorSnippetIds.includes(s.id)) {
        return { snippetId: s.id, suggested: true, reason: "the spark pointed here" };
      }
      return (
        byId.get(s.id) ?? {
          snippetId: s.id,
          suggested: false,
          reason: "doesn't obviously relate",
        }
      );
    });
  }
}
