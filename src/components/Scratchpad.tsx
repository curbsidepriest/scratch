"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createScratch,
  commitSnippets,
  dismissThroughline,
  fetchScratches,
  fetchSpark,
  fetchSuggestion,
} from "@/lib/api";
import type { SegmentSuggestion, SparkDTO } from "@/lib/types";
import { Composer } from "./Composer";
import { ScratchList } from "./ScratchList";
import { Spark } from "./Spark";
import { PromotionOverlay } from "./PromotionOverlay";
import { SegmentationReview } from "./SegmentationReview";

const SCRATCHES_KEY = ["scratches"];
const SPARK_KEY = ["spark"];

export function Scratchpad() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [promoting, setPromoting] = useState<SparkDTO | null>(null);
  const [review, setReview] = useState<{
    scratchId: string;
    suggestion: SegmentSuggestion;
  } | null>(null);

  const { data: scratches = [], isLoading } = useQuery({
    queryKey: SCRATCHES_KEY,
    queryFn: fetchScratches,
  });

  const { data: spark } = useQuery({
    queryKey: SPARK_KEY,
    queryFn: fetchSpark,
  });

  const afterChange = () => {
    queryClient.invalidateQueries({ queryKey: SCRATCHES_KEY });
    queryClient.invalidateQueries({ queryKey: SPARK_KEY });
  };

  const dismiss = useMutation({
    mutationFn: (id: string) => dismissThroughline(id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: SPARK_KEY });
      queryClient.setQueryData(SPARK_KEY, null);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: SPARK_KEY }),
  });

  // Capture → a scratch. Short one-paragraph captures segment silently; longer
  // sessions open the review so the writer curates the split (spec §3).
  const capture = useMutation({
    mutationFn: (content: string) => createScratch(content, "freewrite"),
    onSuccess: async ({ id, suggestion }) => {
      if (suggestion.snippets.length <= 1) {
        await commitSnippets(id, suggestion.scratchLabel, suggestion.snippets);
        afterChange();
      } else {
        setReview({ scratchId: id, suggestion });
      }
    },
  });

  async function openSegment(scratchId: string) {
    const suggestion = await fetchSuggestion(scratchId);
    setReview({ scratchId, suggestion });
  }

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

      <AnimatePresence>
        {review && (
          <SegmentationReview
            scratchId={review.scratchId}
            suggestion={review.suggestion}
            onDone={() => {
              setReview(null);
              afterChange();
            }}
          />
        )}
      </AnimatePresence>

      <div className="mb-6 h-px w-full bg-border" />

      <section className="flex-1">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-faint">Loading…</p>
        ) : (
          <ScratchList scratches={scratches} onSegment={openSegment} />
        )}
      </section>
    </main>
  );
}
