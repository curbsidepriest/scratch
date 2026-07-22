import type {
  BlockDTO,
  LintFlagDTO,
  ProjectDTO,
  RelevantResponse,
  ScratchDTO,
  SegmentSuggestion,
  SnippetDTO,
  SparkDTO,
} from "./types";

export async function fetchSnippets(): Promise<SnippetDTO[]> {
  const res = await fetch("/api/snippets");
  if (!res.ok) throw new Error("Failed to load snippets");
  return res.json();
}

// --- Scratches (raw sessions) + segmentation ---

export async function fetchScratches(): Promise<ScratchDTO[]> {
  const res = await fetch("/api/scratches");
  if (!res.ok) throw new Error("Failed to load scratches");
  return res.json();
}

export async function createScratch(
  content: string,
  sourceMode: string,
): Promise<{ id: string; suggestion: SegmentSuggestion }> {
  const res = await fetch("/api/scratches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, sourceMode }),
  });
  if (!res.ok) throw new Error("Failed to save scratch");
  return res.json();
}

export async function fetchSuggestion(
  scratchId: string,
): Promise<SegmentSuggestion> {
  const res = await fetch(`/api/scratches/${scratchId}/suggestion`);
  if (!res.ok) throw new Error("Failed to load suggestion");
  return res.json();
}

export async function commitSnippets(
  scratchId: string,
  scratchLabel: string,
  snippets: { content: string; label: string }[],
): Promise<void> {
  const res = await fetch(`/api/scratches/${scratchId}/snippets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scratchLabel, snippets }),
  });
  if (!res.ok) throw new Error("Failed to save snippets");
}

export async function updateSnippet(id: string, content: string): Promise<void> {
  const res = await fetch(`/api/snippets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to update snippet");
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

export async function updateProjectSnippet(
  id: string,
  patch: { included?: boolean; relation?: string },
): Promise<void> {
  const res = await fetch(`/api/project-snippets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update snippet");
}

export async function updateThroughlinePhrase(
  id: string,
  phrase: string,
): Promise<void> {
  const res = await fetch(`/api/throughlines/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phrase }),
  });
  if (!res.ok) throw new Error("Failed to update through-line");
}

// --- Architect: blocks ---

export async function fetchBlocks(projectId: string): Promise<BlockDTO[]> {
  const res = await fetch(`/api/projects/${projectId}/blocks`);
  if (!res.ok) throw new Error("Failed to load blocks");
  return res.json();
}

export async function createBlock(
  projectId: string,
  label: string,
): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/blocks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label }),
  });
  if (!res.ok) throw new Error("Failed to create block");
}

export async function updateBlock(
  id: string,
  patch: { label?: string; body?: string | null },
): Promise<void> {
  const res = await fetch(`/api/blocks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update block");
}

export async function addBlockSnippet(
  blockId: string,
  snippetId: string,
): Promise<void> {
  const res = await fetch(`/api/blocks/${blockId}/snippets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ snippetId }),
  });
  if (!res.ok) throw new Error("Failed to add snippet to block");
}

export async function removeBlockSnippet(
  blockId: string,
  snippetId: string,
): Promise<void> {
  const res = await fetch(`/api/blocks/${blockId}/snippets`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ snippetId }),
  });
  if (!res.ok) throw new Error("Failed to remove snippet from block");
}

export async function deleteBlock(id: string): Promise<void> {
  const res = await fetch(`/api/blocks/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete block");
}

/** Write new copy from inside a project; creates a snippet and (optionally)
 * fills a block with it. Returns the new snippet id. */
export async function writeProjectSnippet(
  projectId: string,
  content: string,
  blockId?: string,
): Promise<{ id: string }> {
  const res = await fetch(`/api/projects/${projectId}/snippets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, blockId }),
  });
  if (!res.ok) throw new Error("Failed to write snippet");
  return res.json();
}

export async function reorderBlocks(
  projectId: string,
  orderedIds: string[],
): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/blocks/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) throw new Error("Failed to reorder blocks");
}

// --- Editor: draft + lint ---

export async function saveDraft(projectId: string, draft: string): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draft }),
  });
  if (!res.ok) throw new Error("Failed to save draft");
}

export async function runLint(projectId: string): Promise<LintFlagDTO[]> {
  const res = await fetch(`/api/projects/${projectId}/lint`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to lint");
  return res.json();
}

export async function setLintFlagStatus(
  id: string,
  status: "acknowledged" | "resolved" | "open",
): Promise<void> {
  const res = await fetch(`/api/lint-flags/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update flag");
}
