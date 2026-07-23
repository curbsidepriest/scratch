import type { LinterService } from "./types";
import { StubLinterService } from "./stub";
import { AnthropicLinterService } from "./anthropic";
import { llmEnabled } from "../anthropic";

export type {
  LinterService,
  BlockForGap,
  GapFlag,
  LintCandidate,
} from "./types";

export function getLinterService(): LinterService {
  return llmEnabled() ? new AnthropicLinterService() : new StubLinterService();
}
