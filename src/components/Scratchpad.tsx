"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createSnippet,
  dismissThroughline,
  fetchSnippets,
  fetchSpark,
} from "@/lib/api";
import type { SnippetDTO, SparkDTO } from "@/lib/types";
import { wordCount } from "@/lib/domain";
import { Composer } from "./Composer";
import { SnippetList } from "./SnippetList";
import { Spark } from "./Spark";
import { PromotionOverlay } from "./PromotionOverlay";

const SNIPPETS_KEY = ["snippets"];
const SPARK_KEY = ["spark"];

export function Scratchpad() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // The through-line currently being promoted (drives the overlay).
  const [promoting, setPromoting] = useState<SparkDTO | null>(null);

  const { data: snippets = [], isLoading } = useQuery({
    queryKey: SNIPPETS_KEY,
    queryFn: fetchSnippets,
  });

  // The Ranker reads continuously; we re-check after each capture (spec §5).
  const { data: spark } = useQuery({
    queryKey: SPARK_KEY,
    queryFn: fetchSpark,
  });

  const dismiss = useMutation({
    mutationFn: (id: string) => dismissThroughline(id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: SPARK_KEY });
      queryClient.setQueryData(SPARK_KEY, null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SPARK_KEY });
    },
  });

  const capture = useMutation({
    mutationFn: (content: string) =>
      createSnippet({ content, sourceMode: "freewrite" }),

    // Optimistic: the words appear the instant you capture them.
    onMutate: async (content: string) => {
      await queryClient.cancelQueries({ queryKey: SNIPPETS_KEY });
      const previous =
        queryClient.getQueryData<SnippetDTO[]>(SNIPPETS_KEY) ?? [];
      const optimistic: SnippetDTO = {
        id: `optimistic-${Date.now()}`,
        content,
        createdAt: new Date().toISOString(),
        sourceMode: "freewrite",
        wordCount: wordCount(content),
      };
      queryClient.setQueryData<SnippetDTO[]>(SNIPPETS_KEY, [
        optimistic,
        ...previous,
      ]);
      return { previous };
    },
    onError: (_err, _content, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(SNIPPETS_KEY, ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SNIPPETS_KEY });
      queryClient.invalidateQueries({ queryKey: SPARK_KEY });
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-sm font-medium tracking-wide text-muted">Scratch</h1>
        <Link
          href="/dump"
          className="text-xs text-faint transition-colors hover:text-foreground"
        >
          Timed dump →
        </Link>
      </header>

      <section className="mb-10">
        <Composer onCapture={(content) => capture.mutate(content)} />
      </section>

      <AnimatePresence>
        {spark && (
          <div className="mb-10">
            <Spark
              spark={spark}
              onDevelop={() => setPromoting(spark)}
              onDismiss={() => dismiss.mutate(spark.id)}
              dismissing={dismiss.isPending}
            />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {promoting && (
          <PromotionOverlay
            throughlineId={promoting.id}
            phrase={promoting.phrase}
            onCancel={() => setPromoting(null)}
            onPromoted={(projectId) => {
              queryClient.invalidateQueries({ queryKey: SPARK_KEY });
              router.push(`/project/${projectId}`);
            }}
          />
        )}
      </AnimatePresence>

      <div className="mb-6 h-px w-full bg-border" />

      <section className="flex-1">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-faint">Loading…</p>
        ) : (
          <SnippetList snippets={snippets} />
        )}
      </section>
    </main>
  );
}
