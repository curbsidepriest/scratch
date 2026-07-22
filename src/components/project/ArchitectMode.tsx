"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import {
  createBlock,
  deleteBlock,
  updateBlock,
  updateSnippet,
  writeProjectSnippet,
} from "@/lib/api";
import type { BlockDTO } from "@/lib/types";
import { EditableSnippet } from "../EditableSnippet";

export function ArchitectMode({
  projectId,
  blocks,
}: {
  projectId: string;
  blocks: BlockDTO[];
}) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["blocks", projectId] });
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    queryClient.invalidateQueries({ queryKey: ["snippets"] });
  };

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
        Lay out the piece as placeholders. Drag to reorder. Fill one by dragging
        a snippet from the bank, or write new copy straight into it.
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
              projectId={projectId}
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
  projectId,
  onChange,
}: {
  block: BlockDTO;
  projectId: string;
  onChange: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id: block.id });
  const [editingLabel, setEditingLabel] = useState(false);
  const [label, setLabel] = useState(block.label);
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState("");

  const patch = useMutation({
    mutationFn: (p: { label?: string; snippetId?: string | null }) =>
      updateBlock(block.id, p),
    onSettled: onChange,
  });
  const remove = useMutation({
    mutationFn: () => deleteBlock(block.id),
    onSettled: onChange,
  });
  const editFill = useMutation({
    mutationFn: (content: string) =>
      updateSnippet(block.snippet!.id, content),
    onSettled: onChange,
  });
  const write = useMutation({
    mutationFn: (content: string) =>
      writeProjectSnippet(projectId, content, block.id),
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
        isOver ? "border-accent ring-1 ring-accent" : "border-border"
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
              className="text-left text-sm font-medium text-foreground"
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
              <EditableSnippet
                content={block.snippet.content}
                onSave={(next) => editFill.mutateAsync(next)}
                textClassName="text-[13px] leading-snug text-muted"
              />
              <button
                onClick={() => patch.mutate({ snippetId: null })}
                className="mt-1 text-[11px] text-faint hover:text-muted"
              >
                remove fill
              </button>
            </div>
          ) : writing ? (
            <div className="mt-2">
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write new copy for this block…"
                rows={3}
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-[13px] leading-relaxed text-foreground placeholder:text-faint focus:outline-none"
              />
              <div className="mt-1 flex items-center gap-3 text-[11px]">
                <button
                  onClick={() => {
                    const c = draft.trim();
                    if (c) write.mutate(c);
                    setDraft("");
                    setWriting(false);
                  }}
                  className="text-muted hover:text-foreground"
                >
                  Save as snippet
                </button>
                <button
                  onClick={() => {
                    setDraft("");
                    setWriting(false);
                  }}
                  className="text-faint hover:text-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 rounded-md border border-dashed border-border px-3 py-2 text-xs text-faint">
              Drag a snippet here, or{" "}
              <button
                onClick={() => setWriting(true)}
                className="underline decoration-dotted hover:text-muted"
              >
                write new copy
              </button>
              .
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
