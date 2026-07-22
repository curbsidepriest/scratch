"use client";

import { motion } from "motion/react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import {
  addBlockSnippet,
  fetchBlocks,
  fetchProject,
  removeBlockSnippet,
  reorderBlockSnippets,
  reorderBlocks,
} from "@/lib/api";
import { BankSidebar } from "./BankSidebar";
import { EditablePhrase } from "./project/EditablePhrase";
import { ModeTabs, type Mode } from "./project/ModeTabs";
import { FilterMode } from "./project/FilterMode";
import { ArchitectMode } from "./project/ArchitectMode";
import { EditorMode } from "./project/EditorMode";

export function ProjectShell({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("filter");

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProject(id),
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ["blocks", id],
    queryFn: () => fetchBlocks(id),
  });

  const invalidateBlocks = () =>
    queryClient.invalidateQueries({ queryKey: ["blocks", id] });

  const fill = useMutation({
    mutationFn: (a: { blockId: string; snippetId: string }) =>
      addBlockSnippet(a.blockId, a.snippetId),
    onSettled: invalidateBlocks,
  });
  const reorder = useMutation({
    mutationFn: (orderedIds: string[]) => reorderBlocks(id, orderedIds),
    onSettled: invalidateBlocks,
  });
  const reorderSnippets = useMutation({
    mutationFn: (a: { blockId: string; orderedIds: string[] }) =>
      reorderBlockSnippets(a.blockId, a.orderedIds),
    onSettled: invalidateBlocks,
  });
  const moveSnippet = useMutation({
    mutationFn: async (a: {
      fromBlockId: string;
      toBlockId: string;
      snippetId: string;
    }) => {
      await removeBlockSnippet(a.fromBlockId, a.snippetId);
      await addBlockSnippet(a.toBlockId, a.snippetId);
    },
    onSettled: invalidateBlocks,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const aType = active.data.current?.type;
    const oData = over.data.current;

    // Which block is under the drop? (over may be a block or a snippet-in-block)
    const overBlockId =
      oData?.type === "snippet" ? (oData.blockId as string) : String(over.id);

    // Drop a bank snippet onto a block → add it.
    if (aType === "bank") {
      fill.mutate({
        blockId: overBlockId,
        snippetId: active.data.current!.snippetId as string,
      });
      return;
    }

    // Reorder / move a snippet within or between blocks.
    if (aType === "snippet") {
      const fromBlockId = active.data.current!.blockId as string;
      const snippetId = active.data.current!.snippetId as string;
      if (fromBlockId === overBlockId) {
        const block = blocks.find((b) => b.id === fromBlockId);
        if (!block) return;
        const ids = block.snippets.map((s) => s.id);
        const from = ids.indexOf(snippetId);
        const to =
          oData?.type === "snippet"
            ? ids.indexOf(oData.snippetId as string)
            : ids.length - 1;
        if (from >= 0 && to >= 0 && from !== to) {
          reorderSnippets.mutate({
            blockId: fromBlockId,
            orderedIds: arrayMove(ids, from, to),
          });
        }
      } else {
        moveSnippet.mutate({ fromBlockId, toBlockId: overBlockId, snippetId });
      }
      return;
    }

    // Reorder blocks.
    if (active.id !== over.id) {
      const ids = blocks.map((b) => b.id);
      const from = ids.indexOf(String(active.id));
      const to = ids.indexOf(String(over.id));
      if (from >= 0 && to >= 0) reorder.mutate(arrayMove(ids, from, to));
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <p className="py-16 text-center text-sm text-faint">Opening…</p>
      </main>
    );
  }
  if (isError || !project) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <p className="py-16 text-center text-sm text-faint">
          This piece could not be found.{" "}
          <Link href="/" className="underline">
            Back to Scratch
          </Link>
        </p>
      </main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-5xl flex-1 px-6 py-10"
    >
      <header className="mb-8">
        <div className="flex items-center gap-4 text-xs text-faint">
          <Link href="/" className="transition-colors hover:text-foreground">
            ← Scratch
          </Link>
          <Link href="/pieces" className="transition-colors hover:text-foreground">
            Pieces
          </Link>
        </div>
        <div className="mt-4 text-[11px] uppercase tracking-wider text-faint">
          The piece
        </div>
        <div className="mt-1">
          <EditablePhrase
            projectId={project.id}
            throughlineId={project.throughline.id}
            phrase={project.throughline.phrase}
          />
        </div>
      </header>

      <div className="mb-8">
        <ModeTabs active={mode} onChange={setMode} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <div className="flex flex-col gap-10 md:flex-row md:gap-12">
          <section className="min-w-0 flex-1">
            {mode === "filter" && (
              <FilterMode projectId={project.id} snippets={project.snippets} />
            )}
            {mode === "architect" && (
              <ArchitectMode projectId={project.id} blocks={blocks} />
            )}
            {mode === "editor" && (
              <EditorMode
                projectId={project.id}
                initialDraft={project.draft}
                snippets={project.snippets.filter((s) => s.included)}
              />
            )}
          </section>

          {/* The bank is a permanent column only outside the Editor; in the
              Editor the writing is front and centre and snippets are pulled in. */}
          {mode !== "editor" && (
            <BankSidebar
              projectId={project.id}
              snippets={project.snippets}
              draggable={mode === "architect"}
            />
          )}
        </div>
      </DndContext>
    </motion.main>
  );
}
