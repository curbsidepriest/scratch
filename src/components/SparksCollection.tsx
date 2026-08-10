"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { dismissThroughline, fetchSavedSparks } from "@/lib/api";
import type { SparkDTO } from "@/lib/types";
import { relativeTime } from "@/lib/time";
import { Button } from "@/components/ui/Button";
import { DeleteControl } from "./DeleteControl";
import { PromotionOverlay } from "./PromotionOverlay";

function excerpt(text: string, max = 90): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max).trimEnd()}…`;
}

/**
 * The Sparks library — a shelf of threads set aside with "Not now". Mirrors
 * Pieces: browse them over time, expand one to re-read its snippets, and
 * develop it into a piece whenever it's ready (or discard it for good).
 */
export function SparksCollection() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [promoting, setPromoting] = useState<{
    throughlineId: string;
    phrase: string;
  } | null>(null);

  const { data: sparks = [], isLoading } = useQuery({
    queryKey: ["sparks"],
    queryFn: fetchSavedSparks,
  });

  const discard = useMutation({
    mutationFn: (id: string) => dismissThroughline(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["sparks"] }),
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
        <h1 className="mt-4 text-2xl text-foreground">Sparks</h1>
        <p className="mt-1 text-sm text-muted">
          Threads you&apos;ve set aside. Come back and develop one when it&apos;s
          ready.
        </p>
      </header>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-faint">Loading…</p>
      ) : sparks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted">No sparks saved yet.</p>
          <p className="mt-1 text-sm text-faint">
            When a thread surfaces while you write, choose{" "}
            <span className="italic">Not now</span> to keep it here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sparks.map((s) => (
            <SparkCard
              key={s.id}
              spark={s}
              onDevelop={() =>
                setPromoting({ throughlineId: s.id, phrase: s.phrase })
              }
              onDiscard={() => discard.mutateAsync(s.id)}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {promoting && (
          <PromotionOverlay
            throughlineId={promoting.throughlineId}
            phrase={promoting.phrase}
            onCancel={() => setPromoting(null)}
            onPromoted={(projectId) => {
              queryClient.invalidateQueries({ queryKey: ["sparks"] });
              router.push(`/project/${projectId}`);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function SparkCard({
  spark,
  onDevelop,
  onDiscard,
}: {
  spark: SparkDTO;
  onDevelop: () => void;
  onDiscard: () => Promise<void> | void;
}) {
  const [expanded, setExpanded] = useState(false);
  const count = spark.evidence.length;

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-surface">
      <Button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full justify-start gap-3 border-l-2 border-accent !rounded-none !px-5 !py-4 text-left"
      >
        <span className="text-faint">{expanded ? "▾" : "▸"}</span>
        <span className="min-w-0 flex-1 text-[15px] leading-snug text-foreground">
          {spark.phrase}
        </span>
        <span className="shrink-0 text-xs text-faint">
          {count} snippet{count === 1 ? "" : "s"} · saved{" "}
          {relativeTime(spark.createdAt)}
        </span>
      </Button>

      {expanded && (
        <div className="border-t border-border px-5 py-4">
          <ul className="flex flex-col gap-2.5">
            {spark.evidence.map((e) => (
              <li key={e.id} className="text-sm">
                <span className="text-muted">{e.observation}</span>
                <span className="mt-0.5 block border-l border-border pl-3 text-[13px] italic text-faint">
                  {excerpt(e.snippet.content)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center gap-4">
            <Button onClick={onDevelop} variant="solid" size="md">
              Develop this →
            </Button>
            <DeleteControl onDelete={onDiscard} idle="discard" />
          </div>
        </div>
      )}
    </article>
  );
}
