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
