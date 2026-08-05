"use client";

import { useDraggable } from "@dnd-kit/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { updateProjectSnippet, updateSnippet } from "@/lib/api";
import type { ProjectSnippetDTO } from "@/lib/types";
import { EditableSnippet } from "./EditableSnippet";

function BankItem({
  ps,
  projectId,
  draggable,
  editable,
}: {
  ps: ProjectSnippetDTO;
  projectId: string;
  draggable: boolean;
  editable: boolean;
}) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `bank:${ps.snippet.id}`,
    data: { type: "bank", snippetId: ps.snippet.id },
  });

  const save = useMutation({
    mutationFn: (content: string) => updateSnippet(ps.snippet.id, content),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["blocks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
    },
  });

  // Set aside (bench) / bring back — nothing is destroyed, benched snippets
  // just drop out of the drag source and the Editor's pool.
  const setIncluded = useMutation({
    mutationFn: (included: boolean) =>
      updateProjectSnippet(ps.id, { included }),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
  });

  return (
    <li
      ref={draggable ? setNodeRef : undefined}
      className={`rounded-md border bg-surface text-xs leading-snug text-muted ${
        editable ? "border-border" : "border-dashed border-border text-faint"
      } ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-start gap-1.5 px-2.5 py-2">
        {draggable && (
          <button
            {...listeners}
            {...attributes}
            className="mt-0.5 cursor-grab text-faint hover:text-muted active:cursor-grabbing"
            aria-label="Drag onto a block"
          >
            ⠿
          </button>
        )}
        <div className="min-w-0 flex-1">
          {ps.snippet.label && (
            <div className="mb-1 text-[10px] uppercase tracking-wider text-faint">
              {ps.snippet.label}
            </div>
          )}
          {expanded && editable ? (
            <EditableSnippet
              content={ps.snippet.content}
              onSave={(next) => save.mutateAsync(next)}
              textClassName="text-xs leading-snug text-muted"
            />
          ) : (
            <button
              onClick={() => setExpanded((v) => !v)}
              className={`block w-full text-left ${expanded ? "" : "line-clamp-3"}`}
              title={expanded ? "Click to collapse" : "Click to expand"}
            >
              {ps.snippet.content}
            </button>
          )}
          <div className="mt-1.5 flex justify-end">
            <button
              onClick={() => setIncluded.mutate(ps.included ? false : true)}
              disabled={setIncluded.isPending}
              className="text-[10px] text-faint transition-colors hover:text-muted disabled:opacity-50"
            >
              {ps.included ? "set aside" : "bring back"}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * The persistent snippet bank (spec §6.4/§8a). Longer previews, click to expand
 * to the whole snippet, edit in place. In Architect the included ones are
 * draggable (grip) onto a block. Benched snippets stay here — nothing is
 * destroyed.
 */
export function BankSidebar({
  projectId,
  snippets,
  draggable = false,
}: {
  projectId: string;
  snippets: ProjectSnippetDTO[];
  draggable?: boolean;
}) {
  const included = snippets.filter((s) => s.included);
  const benched = snippets.filter((s) => !s.included);

  return (
    <aside className="w-full shrink-0 md:w-72">
      {/* The bank scrolls on its own — a long list of snippets stays reachable
          without scrolling the essay blocks. Header pinned; only the list moves. */}
      <div className="sticky top-10 flex max-h-[calc(100vh-5rem)] flex-col">
        <h2 className="mb-3 shrink-0 text-[11px] uppercase tracking-wider text-faint">
          Bank · {snippets.length}
          {draggable && (
            <span className="ml-2 normal-case tracking-normal text-faint">
              (drag onto a block)
            </span>
          )}
        </h2>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <ul className="flex flex-col gap-1.5">
            {included.map((ps) => (
              <BankItem
                key={ps.snippet.id}
                ps={ps}
                projectId={projectId}
                draggable={draggable}
                editable
              />
            ))}
          </ul>

          {benched.length > 0 && (
            <>
              <h3 className="mb-2 mt-5 text-[11px] uppercase tracking-wider text-faint">
                Benched · {benched.length}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {benched.map((ps) => (
                  <BankItem
                    key={ps.snippet.id}
                    ps={ps}
                    projectId={projectId}
                    draggable={false}
                    editable={false}
                  />
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
