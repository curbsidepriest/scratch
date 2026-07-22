"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ScratchDTO, SnippetDTO } from "@/lib/types";
import { relativeTime } from "@/lib/time";
import { setSnippetArchived, updateSnippet } from "@/lib/api";
import { EditableSnippet } from "./EditableSnippet";

const MODE_LABELS: Record<string, string> = {
  dump: "dump",
  freewrite: "freewrite",
  quick_capture: "capture",
};

function ScratchCard({
  scratch,
  onSegment,
}: {
  scratch: ScratchDTO;
  onSegment: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["scratches"] });
    queryClient.invalidateQueries({ queryKey: ["spark"] });
  };
  const editSnippet = useMutation({
    mutationFn: (a: { id: string; content: string }) =>
      updateSnippet(a.id, a.content),
    onSettled: invalidate,
  });
  const archive = useMutation({
    mutationFn: (a: { id: string; archived: boolean }) =>
      setSnippetArchived(a.id, a.archived),
    onSettled: invalidate,
  });

  const title =
    scratch.label ||
    scratch.content.replace(/\s+/g, " ").trim().slice(0, 60) ||
    "untitled";
  const active = scratch.snippets.filter((s) => !s.archived);
  const archived = scratch.snippets.filter((s) => s.archived);
  const count = scratch.snippets.length;

  return (
    <article className="rounded-lg border border-border bg-surface">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-5 py-3 text-left"
      >
        <span className="text-faint">{expanded ? "▾" : "▸"}</span>
        <span className="min-w-0 flex-1 truncate text-[15px] text-foreground">
          {title}
        </span>
        <span className="shrink-0 text-xs text-faint">
          {relativeTime(scratch.createdAt)} · {MODE_LABELS[scratch.sourceMode] ?? scratch.sourceMode}
          {" · "}
          {count > 0 ? `${count} snippet${count === 1 ? "" : "s"}` : "not split"}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border px-5 py-4">
          {count === 0 ? (
            <div>
              <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {scratch.content}
              </p>
              <button
                onClick={() => onSegment(scratch.id)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:text-foreground"
              >
                Break into snippets →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {active.map((s) => (
                <SnippetBlock
                  key={s.id}
                  snippet={s}
                  onEdit={(content) => editSnippet.mutateAsync({ id: s.id, content })}
                  onArchive={() => archive.mutate({ id: s.id, archived: true })}
                />
              ))}
              {active.length === 0 && (
                <p className="text-sm text-faint">
                  Every snippet here is archived.
                </p>
              )}

              <div className="flex items-center gap-4 text-[11px] text-faint">
                <button
                  onClick={() => setShowSource((v) => !v)}
                  className="hover:text-muted"
                >
                  {showSource ? "hide source" : "view source"}
                </button>
                {archived.length > 0 && (
                  <button
                    onClick={() => setShowArchived((v) => !v)}
                    className="hover:text-muted"
                  >
                    {showArchived ? "hide" : "show"} {archived.length} archived
                  </button>
                )}
              </div>

              {showSource && (
                <p className="whitespace-pre-wrap rounded-md bg-background p-3 text-[13px] leading-relaxed text-faint">
                  {scratch.content}
                </p>
              )}

              {showArchived &&
                archived.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-start justify-between gap-3 border-l-2 border-dashed border-border pl-3 opacity-60"
                  >
                    <div className="min-w-0">
                      {s.label && (
                        <div className="mb-1 text-[11px] uppercase tracking-wider text-faint">
                          {s.label}
                        </div>
                      )}
                      <p className="text-[14px] leading-relaxed text-faint">
                        {s.content}
                      </p>
                    </div>
                    <button
                      onClick={() => archive.mutate({ id: s.id, archived: false })}
                      className="shrink-0 text-[11px] text-muted hover:text-foreground"
                    >
                      unarchive
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function SnippetBlock({
  snippet,
  onEdit,
  onArchive,
}: {
  snippet: SnippetDTO;
  onEdit: (content: string) => Promise<void> | void;
  onArchive: () => void;
}) {
  return (
    <div className="group/snip border-l-2 border-border pl-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        {snippet.label ? (
          <span className="text-[11px] uppercase tracking-wider text-faint">
            {snippet.label}
          </span>
        ) : (
          <span />
        )}
        <button
          onClick={onArchive}
          className="text-[11px] text-faint opacity-0 transition-opacity hover:text-muted group-hover/snip:opacity-100"
        >
          archive
        </button>
      </div>
      <EditableSnippet
        content={snippet.content}
        onSave={onEdit}
        textClassName="text-[14px] leading-relaxed text-foreground"
      />
    </div>
  );
}

export function ScratchList({
  scratches,
  onSegment,
}: {
  scratches: ScratchDTO[];
  onSegment: (id: string) => void;
}) {
  if (scratches.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-faint">
        Nothing here yet. Whatever you write lands here, and stays.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {scratches.map((s) => (
        <ScratchCard key={s.id} scratch={s} onSegment={onSegment} />
      ))}
    </div>
  );
}
