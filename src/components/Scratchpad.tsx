"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSnippet, fetchSnippets } from "@/lib/api";
import type { SnippetDTO } from "@/lib/types";
import { wordCount } from "@/lib/domain";
import { Composer } from "./Composer";
import { SnippetList } from "./SnippetList";

const SNIPPETS_KEY = ["snippets"];

export function Scratchpad() {
  const queryClient = useQueryClient();

  const { data: snippets = [], isLoading } = useQuery({
    queryKey: SNIPPETS_KEY,
    queryFn: fetchSnippets,
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
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
      <header className="mb-8">
        <h1 className="text-sm font-medium tracking-wide text-muted">Scratch</h1>
      </header>

      <section className="mb-10">
        <Composer onCapture={(content) => capture.mutate(content)} />
      </section>

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
