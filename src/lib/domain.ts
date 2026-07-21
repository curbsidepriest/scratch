// Domain constants + tiny validators.
//
// SQLite has no enums, so the enum-like columns are plain strings. These are the
// single source of truth for their allowed values, enforced at the API boundary.
// (When we move to Postgres these can become real Prisma enums.)

export const SOURCE_MODES = ["dump", "freewrite", "quick_capture"] as const;
export type SourceMode = (typeof SOURCE_MODES)[number];

export const THROUGHLINE_ORIGINS = ["ranker", "user"] as const;
export type ThroughlineOrigin = (typeof THROUGHLINE_ORIGINS)[number];

export const THROUGHLINE_STATUSES = ["surfaced", "dismissed", "promoted"] as const;
export type ThroughlineStatus = (typeof THROUGHLINE_STATUSES)[number];

export const BLOCK_KINDS = ["placeholder", "filled"] as const;
export type BlockKind = (typeof BLOCK_KINDS)[number];

export const LINT_STATUSES = ["open", "acknowledged", "resolved"] as const;
export type LintStatus = (typeof LINT_STATUSES)[number];

export function isSourceMode(v: unknown): v is SourceMode {
  return typeof v === "string" && (SOURCE_MODES as readonly string[]).includes(v);
}

/** Deliberately dumb + predictable for v1 (spec §3). */
export function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}
