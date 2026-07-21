import type { LinterService } from "./types";
import { StubLinterService } from "./stub";
import { AnthropicLinterService } from "./anthropic";

export type {
  LinterService,
  BlockForGap,
  GapFlag,
  LintCandidate,
} from "./types";

export function getLinterService(): LinterService {
  if (process.env.LINTER_IMPL === "anthropic") {
    return new AnthropicLinterService();
  }
  return new StubLinterService();
}
