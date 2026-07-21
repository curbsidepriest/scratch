// The Ranker (the "spark") — service contract. Spec §5.
//
// This interface is deliberately narrow and has NO method that could return
// prose the user might paste. It only ever names *territory* and points at the
// user's own words as evidence. The stub and the (future) Anthropic impl both
// satisfy this exact shape, so swapping is trivial.

export interface RankerSnippet {
  id: string;
  content: string;
  createdAt: string;
  sourceMode: string;
}

/** An observation about the user's OWN writing, tied to a specific snippet. */
export interface RankerEvidence {
  snippetId: string;
  observation: string;
}

/**
 * A candidate through-line. `phrase` names territory (e.g. "how you keep
 * setting speed against depth"), NEVER a title or thesis. If it reads like a
 * headline, it is wrong (spec §5).
 */
export interface RankerCandidate {
  phrase: string;
  evidence: RankerEvidence[];
}

export interface RankerService {
  /**
   * Read the accumulated snippets and *occasionally* return a through-line.
   * Returns null most of the time — the spark is rare, and that is correct.
   */
  evaluate(snippets: RankerSnippet[]): Promise<RankerCandidate | null>;
}
