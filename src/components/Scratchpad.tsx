"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  createScratch,
  commitSnippets,
  createThroughline,
  saveThroughline,
  evaluateSpark,
  fetchScratches,
  fetchSpark,
  fetchSuggestion,
} from "@/lib/api";
import type { SegmentSuggestion } from "@/lib/types";
import { Composer } from "./Composer";
import { Wordmark } from "./Wordmark";
import { ScratchList } from "./ScratchList";
import { Spark } from "./Spark";
import { PromotionOverlay } from "./PromotionOverlay";
import { SegmentationReview } from "./SegmentationReview";
import { Onboarding } from "./Onboarding";
import { StreakBanner } from "./StreakBanner";
import { computeStreak } from "@/lib/streak";

const SCRATCHES_KEY = ["scratches"];
const SPARK_KEY = ["spark"];

export function Scratchpad() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [promoting, setPromoting] = useState<{
    throughlineId: string;
    phrase: string;
  } | null>(null);
  const [startingPiece, setStartingPiece] = useState(false);
  const [startPhrase, setStartPhrase] = useState("");
  const [review, setReview] = useState<{
    scratchId: string;
    suggestion: SegmentSuggestion;
  } | null>(null);

  const { data: scratches = [], isLoading } = useQuery({
    queryKey: SCRATCHES_KEY,
    queryFn: fetchScratches,
  });

  // Daily-writing streak, derived from what's already been written (local time).
  const streak = useMemo(
    () => computeStreak(scratches.map((s) => s.createdAt)),
    [scratches],
  );

  const { data: spark } = useQuery({
    queryKey: SPARK_KEY,
    queryFn: fetchSpark,
  });

  // After new material is written, refresh the scratch list and ask the Ranker
  // to (re)evaluate — the one place the spark evaluation is triggered.
  const afterChange = async () => {
    queryClient.invalidateQueries({ queryKey: SCRATCHES_KEY });
    try {
      const spark = await evaluateSpark();
      queryClient.setQueryData(SPARK_KEY, spark);
    } catch {
      queryClient.invalidateQueries({ queryKey: SPARK_KEY });
    }
  };

  // "Not now" shelves the spark into the Sparks library rather than discarding
  // it — the writer can develop it later.
  const shelve = useMutation({
    mutationFn: (id: string) => saveThroughline(id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: SPARK_KEY });
      queryClient.setQueryData(SPARK_KEY, null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SPARK_KEY });
      queryClient.invalidateQueries({ queryKey: ["sparks"] });
    },
  });

  // Manual, on-demand spark: ask the Ranker to look right now (force = skip the
  // quiet period and re-evaluate even if one is showing).
  const [sparkNote, setSparkNote] = useState<string | null>(null);
  const findSpark = useMutation({
    mutationFn: () => evaluateSpark(true),
    onMutate: () => setSparkNote(null),
    onSuccess: (s) => {
      queryClient.setQueryData(SPARK_KEY, s);
      if (!s) setSparkNote("Nothing's forming yet — keep writing.");
    },
    onError: () => setSparkNote("Couldn't look right now. Try again."),
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

  async function beginOwnPiece() {
    const phrase = startPhrase.trim();
    if (phrase === "") return;
    const { id } = await createThroughline(phrase);
    setStartingPiece(false);
    setStartPhrase("");
    setPromoting({ throughlineId: id, phrase });
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
      <Onboarding />
      <header className="mb-8 flex items-center justify-between gap-4">
        <Wordmark />
        <nav className="flex items-center gap-3">
          {streak.streak > 0 && (
            <span
              title={`${streak.streak}-day writing streak${
                streak.best > streak.streak ? ` · best ${streak.best}` : ""
              }`}
              className={`flex items-center gap-1 text-xs font-medium ${
                streak.writtenToday ? "text-orange-500" : "text-muted"
              }`}
            >
              🔥 {streak.streak}
            </span>
          )}
          {/* Library — navigation, set apart from the creative actions. */}
          <Link
            href="/sparks"
            className="text-xs text-faint transition-colors hover:text-foreground"
          >
            Sparks
          </Link>
          <Link
            href="/pieces"
            className="text-xs text-faint transition-colors hover:text-foreground"
          >
            Pieces
          </Link>
          <span className="h-4 w-px bg-border" aria-hidden />
          {/* Actions — begin writing / start a piece. */}
          <button
            onClick={() => setStartingPiece((v) => !v)}
            className="rounded-full border border-border px-3.5 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            Start a piece
          </button>
          <Link
            href="/dump"
            className="rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
          >
            Just write
          </Link>
          <UserButton />
        </nav>
      </header>

      {!isLoading && (
        <StreakBanner info={streak} onStart={() => router.push("/dump?quick=1")} />
      )}

      <section className="mb-10">
        <Composer onCapture={(content) => capture.mutate(content)} />
      </section>

      {startingPiece && (
        <div className="mb-10 rounded-lg border border-border bg-surface p-4">
          <label className="mb-2 block text-[11px] uppercase tracking-wider text-faint">
            What&apos;s the piece about? (your through-line — territory, not a title)
          </label>
          <input
            autoFocus
            value={startPhrase}
            onChange={(e) => setStartPhrase(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void beginOwnPiece();
              if (e.key === "Escape") setStartingPiece(false);
            }}
            placeholder="e.g. how you keep mistaking avoidance for care"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-faint focus:outline-none"
          />
          <div className="mt-3 flex items-center gap-4">
            <button
              onClick={() => void beginOwnPiece()}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Pick snippets →
            </button>
            <button
              onClick={() => setStartingPiece(false)}
              className="text-xs text-faint transition-colors hover:text-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mb-10">
        <AnimatePresence>
          {spark && (
            <Spark
              spark={spark}
              onDevelop={() =>
                setPromoting({ throughlineId: spark.id, phrase: spark.phrase })
              }
              onDismiss={() => shelve.mutate(spark.id)}
              dismissing={shelve.isPending}
            />
          )}
        </AnimatePresence>

        {/* Manual trigger — ask the Ranker to look on demand. */}
        <div className="mt-3 flex items-center gap-3 text-xs text-faint">
          <button
            onClick={() => findSpark.mutate()}
            disabled={findSpark.isPending}
            className="transition-colors hover:text-foreground disabled:opacity-50"
          >
            {findSpark.isPending
              ? "Looking for a thread…"
              : spark
                ? "Look again"
                : "Look for a spark"}
          </button>
          {sparkNote && !findSpark.isPending && (
            <span className="text-muted">{sparkNote}</span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {promoting && (
          <PromotionOverlay
            throughlineId={promoting.throughlineId}
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
