"use client";

import { motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { deleteProject, fetchProjects } from "@/lib/api";
import { relativeTime } from "@/lib/time";
import { DeleteControl } from "./DeleteControl";

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {pieces.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.35 }}
              className="group relative"
            >
              <Link
                href={`/project/${p.id}`}
                className="flex h-full flex-col justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/50"
              >
                <p className="pr-14 text-[17px] leading-snug text-foreground">
                  {p.title || p.phrase}
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs text-faint">
                  <span>{p.snippetCount} snippet{p.snippetCount === 1 ? "" : "s"}</span>
                  <span aria-hidden>·</span>
                  <span className="tabular-nums">
                    {p.draftWords > 0 ? `${p.draftWords} words drafted` : "no draft yet"}
                  </span>
                  <span aria-hidden>·</span>
                  <span>edited {relativeTime(p.updatedAt)}</span>
                </div>
              </Link>
              <DeleteControl
                onDelete={() => remove.mutateAsync(p.id)}
                idle="delete"
                className="absolute right-4 top-4 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100"
              />
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}
