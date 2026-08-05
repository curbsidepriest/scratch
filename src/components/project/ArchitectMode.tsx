"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import {
  createBlock,
  deleteBlock,
  removeBlockSnippet,
  updateBlock,
  updateSnippet,
  writeProjectSnippet,
} from "@/lib/api";
import type { BlockDTO } from "@/lib/types";
import { EditableSnippet } from "../EditableSnippet";

export function ArchitectMode({
  projectId,
  blocks,
  loading = false,
}: {
  projectId: string;
  blocks: BlockDTO[];
  loading?: boolean;
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
    // Optimistic: show the new block immediately with a temp id; the refetch
    // reconciles it with the real one.
    onMutate: async (label) => {
      await queryClient.cancelQueries({ queryKey: ["blocks", projectId] });
      const prev = queryClient.getQueryData<BlockDTO[]>(["blocks", projectId]);
      const temp: BlockDTO = {
        id: `temp-${crypto.randomUUID()}`,
        label,
        body: null,
        order: prev?.length ?? 0,
        parentBlockId: null,
        kind: "placeholder",
        snippets: [],
        gap: null,
      };
      queryClient.setQueryData<BlockDTO[]>(["blocks", projectId], (old) =>
        old ? [...old, temp] : [temp],
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["blocks", projectId], ctx.prev);
    },
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
          {loading
            ? "Loading…"
            : "No blocks yet. Name the first beat of the piece below."}
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
  const queryClient = useQueryClient();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id: block.id, data: { type: "block" } });
  const [editingLabel, setEditingLabel] = useState(false);
  const [label, setLabel] = useState(block.label);
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState("");

  // Optimistic helpers for the blocks cache — every edit shows instantly.
  const beginOptimistic = async () => {
    await queryClient.cancelQueries({ queryKey: ["blocks", projectId] });
    return { prev: queryClient.getQueryData<BlockDTO[]>(["blocks", projectId]) };
  };
  const writeBlocks = (fn: (prev: BlockDTO[]) => BlockDTO[]) =>
    queryClient.setQueryData<BlockDTO[]>(["blocks", projectId], (old) =>
      old ? fn(old) : old,
    );
  const rollback = (ctx?: { prev?: BlockDTO[] }) => {
    if (ctx?.prev) queryClient.setQueryData(["blocks", projectId], ctx.prev);
  };

  const patch = useMutation({
    mutationFn: (p: { label?: string }) => updateBlock(block.id, p),
    onMutate: async (p) => {
      const ctx = await beginOptimistic();
      if (typeof p.label === "string")
        writeBlocks((prev) =>
          prev.map((b) => (b.id === block.id ? { ...b, label: p.label! } : b)),
        );
      return ctx;
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: onChange,
  });
  const remove = useMutation({
    mutationFn: () => deleteBlock(block.id),
    onMutate: async () => {
      const ctx = await beginOptimistic();
      writeBlocks((prev) => prev.filter((b) => b.id !== block.id));
      return ctx;
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: onChange,
  });
  const editSnippet = useMutation({
    mutationFn: (a: { snippetId: string; content: string }) =>
      updateSnippet(a.snippetId, a.content),
    onSettled: onChange,
  });
  const unfill = useMutation({
    mutationFn: (snippetId: string) => removeBlockSnippet(block.id, snippetId),
    onMutate: async (snippetId) => {
      const ctx = await beginOptimistic();
      writeBlocks((prev) =>
        prev.map((b) =>
          b.id === block.id
            ? { ...b, snippets: b.snippets.filter((s) => s.id !== snippetId) }
            : b,
        ),
      );
      return ctx;
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: onChange,
  });
  const write = useMutation({
    mutationFn: (content: string) =>
      writeProjectSnippet(projectId, content, block.id),
    onMutate: async (content) => {
      const ctx = await beginOptimistic();
      const tempId = `temp-${crypto.randomUUID()}`;
      writeBlocks((prev) =>
        prev.map((b) =>
          b.id === block.id
            ? { ...b, snippets: [...b.snippets, { id: tempId, content, label: null }] }
            : b,
        ),
      );
      return ctx;
    },
    onError: (_e, _v, ctx) => rollback(ctx),
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

          {/* The snippets filling this block (a block can hold many; drag to
              reorder within, or across, blocks). */}
          {block.snippets.length > 0 && (
            <SortableContext
              items={block.snippets.map((s) => `sb:${block.id}:${s.id}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="mt-2 flex flex-col gap-1.5">
                {block.snippets.map((s) => (
                  <SnippetRow
                    key={s.id}
                    blockId={block.id}
                    snippet={s}
                    onEdit={(content) =>
                      editSnippet.mutateAsync({ snippetId: s.id, content })
                    }
                    onRemove={() => unfill.mutate(s.id)}
                  />
                ))}
              </div>
            </SortableContext>
          )}

          {/* Always available: drag another snippet in, or write new copy. */}
          {writing ? (
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
              {block.snippets.length > 0
                ? "Drag another snippet here, or "
                : "Drag a snippet here, or "}
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

function SnippetRow({
  blockId,
  snippet,
  onEdit,
  onRemove,
}: {
  blockId: string;
  snippet: { id: string; content: string; label?: string | null };
  onEdit: (content: string) => Promise<void> | void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: `sb:${blockId}:${snippet.id}`,
      data: { type: "snippet", blockId, snippetId: snippet.id },
    });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 rounded-md border-l-2 border-emerald-500 bg-background px-3 py-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 cursor-grab text-xs text-faint hover:text-muted active:cursor-grabbing"
        aria-label="Drag to reorder snippet"
      >
        ⠿
      </button>
      <div className="min-w-0 flex-1">
        {snippet.label && (
          <div className="mb-1 text-[11px] uppercase tracking-wider text-faint">
            {snippet.label}
          </div>
        )}
        <EditableSnippet
          content={snippet.content}
          onSave={onEdit}
          textClassName="text-[13px] leading-snug text-muted"
        />
        <button
          onClick={onRemove}
          className="mt-1 text-[11px] text-faint hover:text-muted"
        >
          remove
        </button>
      </div>
    </div>
  );
}
