import type { SegmenterService } from "./types";
import { StubSegmenterService } from "./stub";
import { AnthropicSegmenterService } from "./anthropic";

export type { SegmenterService, SegmentResult, SegmentedSnippet } from "./types";

export function getSegmenterService(): SegmenterService {
  if (process.env.SEGMENTER_IMPL === "anthropic") {
    return new AnthropicSegmenterService();
  }
  return new StubSegmenterService();
}
