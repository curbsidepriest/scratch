"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { createBlock, deleteBlock, updateBlock } from "@/lib/api";
import type { BlockDTO, ProjectSnippetDTO } from "@/lib/types";

function excerpt(text: string, max = 120): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max).trimEnd()}…`;
}

export function ArchitectMode({
  projectId,
  blocks,
  includedSnippets,
}: {
  projectId: string;
  blocks: BlockDTO[];
  includedSnippets: ProjectSnippetDTO[];
}) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["blocks", projectId] });

  const [newLabel, setNewLabel] = useState("");
  const add = useMutation({
    mutationFn: (label: string) => createBlock(projectId, label),
    onSettled: invalidate,
  });

  function submitNew() {
    const label = newLabel.trim();
    if (label === "") return;
    add.mutate(label);
    setNewLabel("");
  }

  return (
    <div>
      <h2 className="mb-1 text-[11px] uppercase tracking-wider text-faint">
        Shape &amp; flow
      </h2>
      <p className="mb-5 text-sm text-muted">
        Lay out the piece as placeholders. Drag to reorder, drag a snippet from
        the bank onto one to fill it. This is about shape, not words yet.
      </p>

      <SortableContext
        items={blocks.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3">
          {blocks.map((b) => (
            <BlockCard
              key={b.id}
              block={b}
              includedSnippets={includedSnippets}
              onChange={invalidate}
            />
          ))}
        </div>
      </SortableContext>

      {blocks.length === 0 && (
        <p className="mb-4 py-8 text-center text-sm text-faint">
          No blocks yet. Name the first beat of the piece below.
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitNew()}
          placeholder="e.g. intro with the anecdote from university"
          className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-faint focus:outline-none"
        />
        <button
          onClick={submitNew}
          className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          Add block
        </button>
      </div>
    </div>
  );
}

function BlockCard({
  block,
  includedSnippets,
  onChange,
}: {
  block: BlockDTO;
  includedSnippets: ProjectSnippetDTO[];
  onChange: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id: block.id });
  const [editingLabel, setEditingLabel] = useState(false);
  const [label, setLabel] = useState(block.label);

  const patch = useMutation({
    mutationFn: (p: { label?: string; snippetId?: string | null }) =>
      updateBlock(block.id, p),
    onSettled: onChange,
  });
  const remove = useMutation({
    mutationFn: () => deleteBlock(block.id),
    onSettled: onChange,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-surface px-4 py-3 ${
        isOver ? "border-accent" : "border-border"
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab text-faint hover:text-muted active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          ⠿
        </button>

        <div className="min-w-0 flex-1">
          {editingLabel ? (
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={() => {
                setEditingLabel(false);
                if (label.trim() && label !== block.label)
                  patch.mutate({ label: label.trim() });
                else setLabel(block.label);
              }}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className="w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none"
            />
          ) : (
            <button
              onClick={() => setEditingLabel(true)}
              className="text-left text-sm text-foreground"
            >
              {block.label}
            </button>
          )}

          {block.gap && (
            <div className="mt-1 text-xs text-amber-600 dark:text-amber-500">
              ⚠ {block.gap}
            </div>
          )}

          {block.snippet ? (
            <div className="mt-2 rounded-md border-l-2 border-emerald-500 bg-background px-3 py-2">
              <p className="text-[13px] italic leading-snug text-muted">
                {excerpt(block.snippet.content)}
              </p>
              <button
                onClick={() => patch.mutate({ snippetId: null })}
                className="mt-1 text-[11px] text-faint hover:text-muted"
              >
                remove fill
              </button>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-faint">Fill from a snippet:</span>
              <select
                value=""
                onChange={(e) =>
                  e.target.value && patch.mutate({ snippetId: e.target.value })
                }
                className="max-w-[16rem] rounded border border-border bg-background px-2 py-1 text-xs text-muted focus:outline-none"
              >
                <option value="">choose…</option>
                {includedSnippets.map((ps) => (
                  <option key={ps.snippet.id} value={ps.snippet.id}>
                    {excerpt(ps.snippet.content, 50)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          onClick={() => remove.mutate()}
          className="text-faint transition-colors hover:text-rose-400"
          aria-label="Delete block"
        >
          ×
        </button>
      </div>
    </article>
  );
}
