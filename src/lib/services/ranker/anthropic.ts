import type {
  RankerCandidate,
  RankerRelevance,
  RankerService,
  RankerSnippet,
} from "./types";
import { SYSTEM_PROMPT } from "./prompt";

// The seam for the real thing. Left unimplemented on purpose (spec §5): drop an
// Anthropic call in here, feed it SYSTEM_PROMPT + the snippets, and parse the
// response into a RankerCandidate. No caller changes required.
export class AnthropicRankerService implements RankerService {
  async evaluate(_snippets: RankerSnippet[]): Promise<RankerCandidate | null> {
    // TODO(llm): call the Anthropic API with SYSTEM_PROMPT and the snippets,
    // then validate the JSON into a RankerCandidate (phrase + evidence[]).
    void SYSTEM_PROMPT;
    void _snippets;
    throw new Error(
      "AnthropicRankerService is not implemented yet. Use the stub (unset RANKER_IMPL).",
    );
  }

  async rankRelevance(
    _anchorSnippetIds: string[],
    _snippets: RankerSnippet[],
  ): Promise<RankerRelevance[]> {
    // TODO(llm): ask the model which snippets relate to the through-line.
    void _anchorSnippetIds;
    void _snippets;
    throw new Error(
      "AnthropicRankerService is not implemented yet. Use the stub (unset RANKER_IMPL).",
    );
  }
}
