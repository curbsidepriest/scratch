"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SnippetDTO } from "@/lib/types";
import {
  fetchSnippets,
  setSnippetArchived,
  startPieceFromGem,
  updateSnippet,
} from "@/lib/api";
import { relativeTime } from "@/lib/time";
import { EditableSnippet } from "./EditableSnippet";
import { PromotionOverlay } from "./PromotionOverlay";
import { Button } from "./ui/Button";

/**
 * The gem library (spec §3) — every snippet extracted from every session, flat
 * and dated, separate from the raw sessions on the home Scratchpad. This is the
 * curated collection of good atomic ideas, and the substrate the spark reads.
 * It is deliberately meant to stay small and worth scrolling, never a catalogue.
 */
export function GemsCollection() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);
  const [promoting, setPromoting] = useState<{
    throughlineId: string;
    phrase: string;
  } | null>(null);

  const { data: snippets = [], isLoading } = useQuery({
    queryKey: ["snippets"],
    queryFn: fetchSnippets,
  });

  // Seed a piece from one gem, then hand off to the promotion pull-in.
  const seed = useMutation({
    mutationFn: (snippetId: string) => startPieceFromGem(snippetId),
    onSuccess: ({ id, phrase }) => setPromoting({ throughlineId: id, phrase }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["snippets"] });
    queryClient.invalidateQueries({ queryKey: ["scratches"] });
    queryClient.invalidateQueries({ queryKey: ["spark"] });
  };
  const edit = useMutation({
    mutationFn: (a: { id: string; content: string }) =>
      updateSnippet(a.id, a.content),
    onSettled: invalidate,
  });
  const archive = useMutation({
    mutationFn: (a: { id: string; archived: boolean }) =>
      setSnippetArchived(a.id, a.archived),
    onSettled: invalidate,
  });

  const active = useMemo(
    () => snippets.filter((s) => !s.archived),
    [snippets],
  );
  const archived = useMemo(
    () => snippets.filter((s) => s.archived),
    [snippets],
  );

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <header className="mb-10">
        <Link
          href="/"
          className="text-xs text-faint transition-colors hover:text-foreground"
        >
          ← Scratch
        </Link>
        <h1 className="mt-4 text-2xl text-foreground">Gems</h1>
        <p className="mt-1 text-sm text-muted">
          The good lines, pulled out of your sessions. This is what the spark
          reads. Kept small on purpose — a real library, not everything you wrote.
        </p>
      </header>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-faint">Loading…</p>
      ) : active.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted">No gems yet.</p>
          <p className="mt-1 text-sm text-faint">
            Write a{" "}
            <Link href="/dump" className="underline">
              session
            </Link>
            , then keep the lines worth keeping.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {active.map((s, i) => (
            <Gem
              key={s.id}
              snippet={s}
              index={i}
              onEdit={(content) => edit.mutateAsync({ id: s.id, content })}
              onArchive={() => archive.mutate({ id: s.id, archived: true })}
              onStartPiece={() => seed.mutate(s.id)}
              starting={seed.isPending && seed.variables === s.id}
            />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <div className="mt-10">
          <Button
            onClick={() => setShowArchived((v) => !v)}
            className="!text-[11px]"
          >
            {showArchived ? "hide" : "show"} {archived.length} archived
          </Button>
          {showArchived && (
            <div className="mt-4 flex flex-col gap-3">
              {archived.map((s) => (
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
                  <Button
                    onClick={() => archive.mutate({ id: s.id, archived: false })}
                    className="shrink-0 !text-[11px]"
                  >
                    restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {promoting && (
          <PromotionOverlay
            throughlineId={promoting.throughlineId}
            phrase={promoting.phrase}
            onCancel={() => setPromoting(null)}
            onPromoted={(projectId) => router.push(`/project/${projectId}`)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function Gem({
  snippet,
  index,
  onEdit,
  onArchive,
  onStartPiece,
  starting,
}: {
  snippet: SnippetDTO;
  index: number;
  onEdit: (content: string) => Promise<void> | void;
  onArchive: () => void;
  onStartPiece: () => void;
  starting: boolean;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.25), duration: 0.3 }}
      className="group rounded-lg border border-border bg-surface p-4"
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        {snippet.label ? (
          <span className="text-[11px] uppercase tracking-wider text-faint">
            {snippet.label}
          </span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3 text-[11px] text-faint">
          <span>{relativeTime(snippet.createdAt)}</span>
          <Button
            onClick={onArchive}
            className="opacity-0 group-hover:opacity-100"
          >
            archive
          </Button>
        </div>
      </div>
      <EditableSnippet
        content={snippet.content}
        onSave={onEdit}
        textClassName="text-[15px] leading-relaxed text-foreground"
      />
      <div className="mt-3 flex justify-end">
        <Button
          variant="subtle"
          onClick={onStartPiece}
          disabled={starting}
          pending={starting}
          className="opacity-0 group-hover:opacity-100 !text-[11px]"
        >
          {starting ? "Starting…" : "Start a piece from this →"}
        </Button>
      </div>
    </motion.article>
  );
}
