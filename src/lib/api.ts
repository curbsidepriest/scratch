import type { SnippetDTO } from "./types";

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
