"use client";

import { useDraggable } from "@dnd-kit/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { updateSnippet } from "@/lib/api";
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
      <div className="sticky top-10">
        <h2 className="mb-3 text-[11px] uppercase tracking-wider text-faint">
          Bank · {snippets.length}
          {draggable && (
            <span className="ml-2 normal-case tracking-normal text-faint">
              (drag onto a block)
            </span>
          )}
        </h2>
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
    </aside>
  );
}
