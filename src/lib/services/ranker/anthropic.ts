import type { RankerCandidate, RankerService, RankerSnippet } from "./types";
import { SYSTEM_PROMPT } from "./prompt";

// The seam for the real thing. Left unimplemented on purpose (spec §5): drop an
// Anthropic call in here, feed it SYSTEM_PROMPT + the snippets, and parse the
// response into a RankerCandidate. No caller changes required.
export class AnthropicRankerService implements RankerService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async evaluate(_snippets: RankerSnippet[]): Promise<RankerCandidate | null> {
    // TODO(llm): call the Anthropic API with SYSTEM_PROMPT and the snippets,
    // then validate the JSON into a RankerCandidate (phrase + evidence[]).
    void SYSTEM_PROMPT;
    throw new Error(
      "AnthropicRankerService is not implemented yet. Use the stub (unset RANKER_IMPL).",
    );
  }
}
