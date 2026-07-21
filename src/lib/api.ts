import type {
  ProjectDTO,
  RelevantResponse,
  SnippetDTO,
  SparkDTO,
} from "./types";

export async function fetchSnippets(): Promise<SnippetDTO[]> {
  const res = await fetch("/api/snippets");
  if (!res.ok) throw new Error("Failed to load snippets");
  return res.json();
}

export async function createSnippet(input: {
  content: string;
  sourceMode?: string;
}): Promise<SnippetDTO> {
  const res = await fetch("/api/snippets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to capture snippet");
  return res.json();
}

export async function fetchSpark(): Promise<SparkDTO | null> {
  const res = await fetch("/api/spark");
  if (!res.ok) throw new Error("Failed to check for a spark");
  return res.json();
}

export async function dismissThroughline(id: string): Promise<void> {
  const res = await fetch(`/api/throughlines/${id}/dismiss`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to dismiss");
}

export async function fetchRelevant(
  throughlineId: string,
): Promise<RelevantResponse> {
  const res = await fetch(`/api/throughlines/${throughlineId}/relevant`);
  if (!res.ok) throw new Error("Failed to load relevant snippets");
  return res.json();
}

export async function promoteThroughline(
  throughlineId: string,
  snippetIds: string[],
): Promise<{ id: string }> {
  const res = await fetch(`/api/throughlines/${throughlineId}/promote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ snippetIds }),
  });
  if (!res.ok) throw new Error("Failed to promote");
  return res.json();
}

export async function fetchProject(id: string): Promise<ProjectDTO> {
  const res = await fetch(`/api/projects/${id}`);
  if (!res.ok) throw new Error("Failed to load project");
  return res.json();
}
