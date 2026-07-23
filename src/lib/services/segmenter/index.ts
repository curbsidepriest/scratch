import type { SegmenterService } from "./types";
import { StubSegmenterService } from "./stub";
import { AnthropicSegmenterService } from "./anthropic";
import { llmEnabled } from "../anthropic";

export type { SegmenterService, SegmentResult, SegmentedSnippet } from "./types";

export function getSegmenterService(): SegmenterService {
  return llmEnabled()
    ? new AnthropicSegmenterService()
    : new StubSegmenterService();
}
