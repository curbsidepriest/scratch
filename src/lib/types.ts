// Client-facing shapes for API responses (dates serialized as ISO strings).

export interface SnippetDTO {
  id: string;
  content: string;
  createdAt: string;
  sourceMode: string;
  wordCount: number;
}
