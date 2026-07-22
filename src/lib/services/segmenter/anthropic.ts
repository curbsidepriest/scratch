import type { SegmentResult, SegmenterService } from "./types";
import { SYSTEM_PROMPT } from "./prompt";

// The seam for the real segmenter. Unimplemented on purpose — feed the full
// scratch to the model with SYSTEM_PROMPT and parse into SegmentResult
// (verbatim slices + descriptive labels). No caller changes required.
export class AnthropicSegmenterService implements SegmenterService {
  async segment(_text: string): Promise<SegmentResult> {
    void SYSTEM_PROMPT;
    void _text;
    throw new Error(
      "AnthropicSegmenterService is not implemented yet. Use the stub (unset SEGMENTER_IMPL).",
    );
  }
}
