// The Linter — service contract for Architect gap flags and Editor inline
// flags (spec §8b/§8c). Like the Ranker, it only ever SURFACES observations:
// it never supplies a fix or rewrites text. No method returns pasteable prose.

export interface BlockForGap {
  id: string;
  label: string;
  body: string | null;
  filled: boolean;
}

/** A surfaced gap in the skeleton — "no example here", "claim needs support". */
export interface GapFlag {
  blockId: string;
  reason: string;
}

/** A surfaced issue in the draft. `range` locates it; it carries no fix. */
export interface LintCandidate {
  /** Serialized locator, e.g. JSON {"para": 2}. */
  range: string;
  reason: string;
  /** The exact text the flag was raised against (to detect material change). */
  quote: string;
}

export interface LinterService {
  /** Architect: surface gaps in the block skeleton. Never fills them. */
  findGaps(blocks: BlockForGap[]): Promise<GapFlag[]>;
  /**
   * Editor: surface issues in the draft. Stays quiet until there is enough
   * text to react to (no flagging fragments). Never supplies the fix.
   */
  lint(draft: string): Promise<LintCandidate[]>;
}
