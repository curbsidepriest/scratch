import type {
  BlockForGap,
  GapFlag,
  LintCandidate,
  LinterService,
} from "./types";
import { SYSTEM_PROMPT } from "./prompt";

// The seam for the real linter. Unimplemented on purpose — wire an Anthropic
// call using SYSTEM_PROMPT and parse into GapFlag[]/LintCandidate[]. No caller
// changes required.
export class AnthropicLinterService implements LinterService {
  async findGaps(_blocks: BlockForGap[]): Promise<GapFlag[]> {
    void SYSTEM_PROMPT;
    void _blocks;
    throw new Error(
      "AnthropicLinterService is not implemented yet. Use the stub (unset LINTER_IMPL).",
    );
  }

  async lint(_draft: string): Promise<LintCandidate[]> {
    void _draft;
    throw new Error(
      "AnthropicLinterService is not implemented yet. Use the stub (unset LINTER_IMPL).",
    );
  }
}
