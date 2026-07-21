import type { RankerService } from "./types";
import { StubRankerService } from "./stub";
import { AnthropicRankerService } from "./anthropic";

export type {
  RankerService,
  RankerCandidate,
  RankerEvidence,
  RankerRelevance,
  RankerSnippet,
} from "./types";

// One place to choose the implementation. Defaults to the stub; set
// RANKER_IMPL=anthropic once the real service is wired.
export function getRankerService(): RankerService {
  if (process.env.RANKER_IMPL === "anthropic") {
    return new AnthropicRankerService();
  }
  return new StubRankerService();
}
