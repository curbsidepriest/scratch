// Client-facing shapes for API responses (dates serialized as ISO strings).

export interface SnippetDTO {
  id: string;
  content: string;
  createdAt: string;
  sourceMode: string;
  wordCount: number;
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

export interface ProjectSnippetDTO {
  included: boolean;
  snippet: SnippetDTO;
}

export interface ProjectDTO {
  id: string;
  title: string | null;
  createdAt: string;
  throughline: { id: string; phrase: string };
  snippets: ProjectSnippetDTO[];
}
