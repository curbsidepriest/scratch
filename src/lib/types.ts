// Client-facing shapes for API responses (dates serialized as ISO strings).

export interface SnippetDTO {
  id: string;
  content: string;
  label?: string | null;
  archived?: boolean;
  createdAt: string;
  sourceMode: string;
  wordCount: number;
  /** Referenced by at least one project as an included snippet. */
  used?: boolean;
  /** Titles of the pieces this gem is used in. */
  usedIn?: string[];
}

/** A raw writing session, with its extracted snippets nested under it. */
export interface ScratchDTO {
  id: string;
  content: string;
  label: string | null;
  sourceMode: string;
  wordCount: number;
  createdAt: string;
  snippets: SnippetDTO[];
}

export interface SegmentedSnippetDTO {
  content: string;
  label: string;
}

export interface SegmentSuggestion {
  scratchLabel: string;
  snippets: SegmentedSnippetDTO[];
}

export interface SparkEvidenceDTO {
  id: string;
  observation: string;
  snippet: { id: string; content: string };
}

/** A surfaced through-line (the "spark"). `phrase` is territory, not a title. */
export interface SparkDTO {
  id: string;
  phrase: string;
  origin: string;
  createdAt: string;
  evidence: SparkEvidenceDTO[];
}

/** A snippet plus its stubbed relevance to a through-line, for promotion. */
export interface RelevantSnippetDTO extends SnippetDTO {
  suggested: boolean;
  reason: string;
}

export interface RelevantResponse {
  throughline: { id: string; phrase: string };
  snippets: RelevantSnippetDTO[];
}

export type Relation = "relates" | "unsure" | "unrelated";

export interface ProjectSnippetDTO {
  id: string;
  included: boolean;
  relation: Relation;
  snippet: SnippetDTO;
}

export interface ProjectDTO {
  id: string;
  title: string | null;
  draft: string;
  createdAt: string;
  throughline: { id: string; phrase: string };
  snippets: ProjectSnippetDTO[];
}

export interface ProjectSummaryDTO {
  id: string;
  phrase: string;
  title: string | null;
  snippetCount: number;
  draftWords: number;
  dueAt: string | null;
  status: string; // active | finished | released
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlockDTO {
  id: string;
  label: string;
  body: string | null;
  order: number;
  parentBlockId: string | null;
  kind: string;
  snippets: { id: string; content: string; label?: string | null }[];
  gap: string | null;
}

export interface LintFlagDTO {
  id: string;
  reason: string;
  quote: string;
}
