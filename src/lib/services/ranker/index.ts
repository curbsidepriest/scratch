import type { RankerService } from "./types";
import { StubRankerService } from "./stub";
import { AnthropicRankerService } from "./anthropic";
import { llmEnabled } from "../anthropic";

export type {
  RankerService,
  RankerCandidate,
  RankerEvidence,
  RankerRelevance,
  RankerSnippet,
} from "./types";

// Use the real service when an Anthropic key is present; otherwise the stub.
export function getRankerService(): RankerService {
  return llmEnabled() ? new AnthropicRankerService() : new StubRankerService();
}
