"use client";

import { useDraggable } from "@dnd-kit/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  addProjectGem,
  fetchSnippets,
  updateProjectSnippet,
  updateSnippet,
} from "@/lib/api";
import type { ProjectSnippetDTO } from "@/lib/types";
import { Button } from "@/components/ui/Button";
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
          <Button
            {...listeners}
            {...attributes}
            className="mt-0.5 !cursor-grab !text-faint active:!cursor-grabbing"
            aria-label="Drag onto a block"
          >
            ⠿
          </Button>
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
            <Button
              onClick={() => setExpanded((v) => !v)}
              className={`block w-full text-left ${expanded ? "" : "line-clamp-3"}`}
              title={expanded ? "Click to collapse" : "Click to expand"}
            >
              {ps.snippet.content}
            </Button>
          )}
          <div className="mt-1.5 flex justify-end">
            <Button
              onClick={() => setIncluded.mutate(ps.included ? false : true)}
              disabled={setIncluded.isPending}
              pending={setIncluded.isPending}
              className="!text-[10px]"
            >
              {ps.included ? "set aside" : "bring back"}
            </Button>
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
  const queryClient = useQueryClient();
  const included = snippets.filter((s) => s.included);
  const benched = snippets.filter((s) => !s.included);

  // Benched snippets accordion away by default so they don't eat the sidebar.
  const [showBenched, setShowBenched] = useState(false);
  // The "draw on more gems" picker (Architect only).
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState("");

  // The whole gem library, to draw in gems that weren't initially chosen.
  const { data: library = [] } = useQuery({
    queryKey: ["snippets"],
    queryFn: fetchSnippets,
    enabled: adding, // only fetch when the picker is opened
  });
  const inProject = useMemo(
    () => new Set(snippets.map((s) => s.snippet.id)),
    [snippets],
  );
  const candidates = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return library.filter(
      (s) =>
        !s.archived &&
        !inProject.has(s.id) &&
        (q === "" ||
          s.content.toLowerCase().includes(q) ||
          (s.label ?? "").toLowerCase().includes(q)),
    );
  }, [library, inProject, filter]);

  const add = useMutation({
    mutationFn: (snippetId: string) => addProjectGem(projectId, snippetId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
    },
  });

  return (
    <aside className="w-full shrink-0 md:w-72">
      {/* The bank scrolls on its own — a long list of snippets stays reachable
          without scrolling the essay blocks. Header pinned; only the list moves. */}
      <div className="sticky top-10 flex max-h-[calc(100vh-5rem)] flex-col">
        <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
          <h2 className="text-[11px] uppercase tracking-wider text-faint">
            Bank · {included.length}
            {draggable && (
              <span className="ml-2 normal-case tracking-normal text-faint">
                (drag onto a block)
              </span>
            )}
          </h2>
          {draggable && (
            <Button
              onClick={() => setAdding((v) => !v)}
              className="!text-[11px]"
            >
              {adding ? "done" : "+ add gems"}
            </Button>
          )}
        </div>

        {/* Draw on gems not initially chosen (spec §8). */}
        {adding && (
          <div className="mb-3 shrink-0 rounded-md border border-border bg-background p-2">
            <input
              autoFocus
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search your gems…"
              className="mb-2 w-full rounded border border-border bg-surface px-2 py-1 text-xs text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            />
            <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
              {candidates.length === 0 ? (
                <li className="px-1 py-2 text-[11px] text-faint">
                  {filter ? "No gems match." : "Every gem is already in this piece."}
                </li>
              ) : (
                candidates.map((s) => (
                  <li key={s.id}>
                    <Button
                      press={false}
                      onClick={() => add.mutate(s.id)}
                      disabled={add.isPending}
                      className="w-full !justify-start gap-2 text-left"
                    >
                      <span className="text-accent">+</span>
                      <span className="min-w-0 flex-1 truncate text-xs text-muted">
                        {s.label || s.content}
                      </span>
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

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
          {included.length === 0 && (
            <p className="py-4 text-[11px] text-faint">
              No gems in this piece yet.
              {draggable ? " Add some above." : ""}
            </p>
          )}

          {benched.length > 0 && (
            <>
              <Button
                press={false}
                onClick={() => setShowBenched((v) => !v)}
                className="mb-2 mt-5 w-full !justify-start gap-1.5 !text-[11px] uppercase tracking-wider text-faint"
              >
                <span>{showBenched ? "▾" : "▸"}</span> Set aside · {benched.length}
              </Button>
              {showBenched && (
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
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
