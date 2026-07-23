import type { SegmentResult, SegmenterService } from "./types";
import { SYSTEM_PROMPT } from "./prompt";
import { structured } from "../anthropic";

// The real Segmenter. Splits a session into paragraph-sized snippets (verbatim
// slices) and gives each a short, boring, descriptive label. SYSTEM_PROMPT
// forbids rewriting or poetic titles.

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["scratchLabel", "snippets"],
  properties: {
    scratchLabel: { type: "string" },
    snippets: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["content", "label"],
        properties: {
          content: { type: "string" },
          label: { type: "string" },
        },
      },
    },
  },
} as const;

export class AnthropicSegmenterService implements SegmenterService {
  async segment(text: string): Promise<SegmentResult> {
    const result = await structured<SegmentResult>({
      system: SYSTEM_PROMPT,
      user:
        "Split this writing session into paragraph-sized snippets. Each snippet's " +
        "content must be VERBATIM from the source (you choose the cut points, you " +
        "do not rewrite). Give each a short, descriptive, non-poetic label. Also " +
        "give the whole session one descriptive label.\n\n" +
        text,
      schema: SCHEMA as unknown as Record<string, unknown>,
      maxTokens: 16000,
    });
    // Fall back to the whole text if the model returned nothing usable.
    if (!result.snippets || result.snippets.length === 0) {
      return {
        scratchLabel: result.scratchLabel ?? "",
        snippets: [{ content: text.trim(), label: result.scratchLabel ?? "" }],
      };
    }
    return result;
  }
}
