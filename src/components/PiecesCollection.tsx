"use client";

import { motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { deleteProject, fetchProjects, saveProjectTitle } from "@/lib/api";
import { relativeTime } from "@/lib/time";
import { countdown } from "@/lib/anvil";
import type { ProjectSummaryDTO } from "@/lib/types";
import { DeleteControl } from "./DeleteControl";
import { EditableTitle } from "./EditableTitle";

/**
 * The collection of pieces — the payoff surface. This is ultimately what the
 * whole app is for, so it's meant to feel like a quiet, growing shelf you're
 * glad to look at. Each piece resumes where you left it.
 */
export function PiecesCollection() {
  const queryClient = useQueryClient();
  const { data: pieces = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
  const rename = useMutation({
    mutationFn: (a: { id: string; title: string }) =>
      saveProjectTitle(a.id, a.title),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const now = Date.now();
  const finished = pieces.filter((p) => p.status === "finished");
  const inProgress = pieces.filter((p) => p.status !== "finished");

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <header className="mb-10">
        <Link
          href="/"
          className="text-xs text-faint transition-colors hover:text-foreground"
        >
          ← Scratch
        </Link>
        <h1 className="mt-4 text-2xl text-foreground">Pieces</h1>
        <p className="mt-1 text-sm text-muted">
          Everything you&apos;ve started shaping. Pick one up where you left it.
        </p>
      </header>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-faint">Loading…</p>
      ) : pieces.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted">No pieces yet.</p>
          <p className="mt-1 text-sm text-faint">
            Adopt a spark, or{" "}
            <Link href="/" className="underline">
              start one of your own
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {inProgress.map((p, i) => (
              <PieceCard
                key={p.id}
                piece={p}
                index={i}
                now={now}
                onRename={(title) => rename.mutateAsync({ id: p.id, title })}
                onDelete={() => remove.mutateAsync(p.id)}
              />
            ))}
          </div>
          {inProgress.length === 0 && (
            <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-faint">
              Nothing in progress. Start something — and put it on the anvil.
            </p>
          )}

          {finished.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-[11px] uppercase tracking-wider text-faint">
                Finished · {finished.length}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {finished.map((p, i) => (
                  <PieceCard
                    key={p.id}
                    piece={p}
                    index={i}
                    now={now}
                    onRename={(title) => rename.mutateAsync({ id: p.id, title })}
                    onDelete={() => remove.mutateAsync(p.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function PieceCard({
  piece: p,
  index,
  now,
  onRename,
  onDelete,
}: {
  piece: ProjectSummaryDTO;
  index: number;
  now: number;
  onRename: (title: string) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}) {
  const finished = p.status === "finished";
  const c = p.dueAt && !finished ? countdown(p.dueAt, now) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.35 }}
      className="group relative"
    >
      <Link
        href={`/project/${p.id}`}
        className={`flex h-full flex-col justify-between rounded-xl border bg-surface p-5 transition-colors hover:border-accent/50 ${
          finished ? "border-border/70" : "border-border"
        }`}
      >
        <div className="pr-14">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            {finished && (
              <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
                ✓ finished
              </span>
            )}
            {c && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  c.state === "cold"
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                }`}
              >
                <span aria-hidden className={c.state === "cold" ? "grayscale" : ""}>
                  🔥
                </span>
                {c.label}
              </span>
            )}
          </div>
          <EditableTitle
            value={p.title}
            placeholder="Untitled piece"
            onSave={onRename}
            className="text-[17px] font-medium leading-snug"
          />
          <p className="mt-1.5 line-clamp-3 pl-1.5 text-[13px] leading-relaxed text-muted">
            {p.phrase}
          </p>
        </div>
        <div className="mt-6 flex items-center gap-2 text-xs text-faint">
          <span>{p.snippetCount} snippet{p.snippetCount === 1 ? "" : "s"}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">
            {p.draftWords > 0 ? `${p.draftWords} words drafted` : "no draft yet"}
          </span>
          <span aria-hidden>·</span>
          <span>
            {finished && p.finishedAt
              ? `finished ${relativeTime(p.finishedAt)}`
              : `edited ${relativeTime(p.updatedAt)}`}
          </span>
        </div>
      </Link>
      <DeleteControl
        onDelete={onDelete}
        idle="delete"
        className="absolute right-4 top-4 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100"
      />
    </motion.div>
  );
}
