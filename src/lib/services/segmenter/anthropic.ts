import type { SegmentResult, SegmenterService } from "./types";
import { SYSTEM_PROMPT } from "./prompt";
import { structured } from "../anthropic";

// The real Segmenter. Conservatively extracts the GEMS from a session (0..N
// verbatim slices) and gives each a short, boring, descriptive label.
// SYSTEM_PROMPT forbids rewriting, poetic titles, and padding out the result.

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
        "Read this writing session and extract only the GEMS — the few lines or " +
        "passages worth keeping on their own. Each gem's content must be VERBATIM " +
        "from the source (you choose which slices to lift, you do not rewrite). " +
        "Give each a short, descriptive, non-poetic label. Be conservative: " +
        "returning an empty snippets array is a valid and common answer. Do NOT " +
        "return the whole session as one snippet. Always give the whole session " +
        "one descriptive label regardless.\n\n" +
        text,
      schema: SCHEMA as unknown as Record<string, unknown>,
      maxTokens: 16000,
    });
    // Zero gems is a legitimate result — the session is preserved in its scratch,
    // so we never pad the library by falling back to the whole text.
    return {
      scratchLabel: result.scratchLabel ?? "",
      snippets: Array.isArray(result.snippets) ? result.snippets : [],
    };
  }
}
