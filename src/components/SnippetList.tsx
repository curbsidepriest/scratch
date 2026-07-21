"use client";

import type { SnippetDTO } from "@/lib/types";
import { relativeTime } from "@/lib/time";

const MODE_LABELS: Record<string, string> = {
  dump: "dump",
  freewrite: "freewrite",
  quick_capture: "capture",
};

function SnippetCard({ snippet }: { snippet: SnippetDTO }) {
  const isOptimistic = snippet.id.startsWith("optimistic-");
  return (
    <article
      className={`rounded-lg border border-border bg-surface px-5 py-4 transition-opacity ${
        isOptimistic ? "opacity-60" : "opacity-100"
      }`}
    >
      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
        {snippet.content}
      </p>
      <div className="mt-3 flex items-center gap-2 text-xs text-faint">
        <span>{relativeTime(snippet.createdAt)}</span>
        <span aria-hidden>·</span>
        <span className="tabular-nums">{snippet.wordCount} words</span>
        <span aria-hidden>·</span>
        <span>{MODE_LABELS[snippet.sourceMode] ?? snippet.sourceMode}</span>
      </div>
    </article>
  );
}

export function SnippetList({ snippets }: { snippets: SnippetDTO[] }) {
  if (snippets.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-faint">
        Nothing here yet. Whatever you write lands here, and stays.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {snippets.map((s) => (
        <SnippetCard key={s.id} snippet={s} />
      ))}
    </div>
  );
}
