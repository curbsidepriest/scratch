"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProjectSnippet, updateSnippet } from "@/lib/api";
import type { ProjectSnippetDTO, Relation } from "@/lib/types";
import { EditableSnippet } from "../EditableSnippet";

const NEXT: Record<Relation, Relation> = {
  relates: "unsure",
  unsure: "unrelated",
  unrelated: "relates",
};

const REL_META: Record<Relation, { label: string; dot: string; border: string }> = {
  relates: { label: "relates", dot: "bg-emerald-500", border: "border-l-emerald-500" },
  unsure: { label: "unsure", dot: "bg-amber-500", border: "border-l-amber-500" },
  unrelated: { label: "doesn't", dot: "bg-rose-400", border: "border-l-rose-400" },
};

export function FilterMode({
  projectId,
  snippets,
}: {
  projectId: string;
  snippets: ProjectSnippetDTO[];
}) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  const update = useMutation({
    mutationFn: (args: {
      id: string;
      patch: { included?: boolean; relation?: string };
    }) => updateProjectSnippet(args.id, args.patch),
    onSettled: invalidate,
  });
  const editContent = useMutation({
    mutationFn: (args: { snippetId: string; content: string }) =>
      updateSnippet(args.snippetId, args.content),
    onSettled: invalidate,
  });

  const included = snippets.filter((s) => s.included);
  const benched = snippets.filter((s) => !s.included);

  return (
    <div>
      <h2 className="mb-1 text-[11px] uppercase tracking-wider text-faint">
        What belongs
      </h2>
      <p className="mb-5 text-sm text-muted">
        Colour each by how it serves the spine. What doesn&apos;t fit isn&apos;t
        deleted — it goes to the bench and might start the next piece.
      </p>

      <div className="flex flex-col gap-3">
        {included.map((ps) => {
          const meta = REL_META[ps.relation];
          return (
            <article
              key={ps.id}
              className={`rounded-lg border border-l-2 border-border bg-surface px-5 py-4 ${meta.border}`}
            >
              <EditableSnippet
                content={ps.snippet.content}
                onSave={(content) =>
                  editContent.mutateAsync({ snippetId: ps.snippet.id, content })
                }
                textClassName="text-[15px] leading-relaxed text-foreground"
              />
              <div className="mt-3 flex items-center gap-4 text-xs">
                <button
                  onClick={() =>
                    update.mutate({
                      id: ps.id,
                      patch: { relation: NEXT[ps.relation] },
                    })
                  }
                  className="flex items-center gap-1.5 text-muted transition-colors hover:text-foreground"
                  title="Cycle how this relates"
                >
                  <span className={`inline-block h-2 w-2 rounded-full ${meta.dot}`} />
                  {meta.label}
                </button>
                <button
                  onClick={() =>
                    update.mutate({ id: ps.id, patch: { included: false } })
                  }
                  className="text-faint transition-colors hover:text-muted"
                >
                  Move to bank
                </button>
              </div>
            </article>
          );
        })}
        {included.length === 0 && (
          <p className="py-10 text-center text-sm text-faint">
            Nothing here right now. Bring something back from the bench below.
          </p>
        )}
      </div>

      {benched.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-[11px] uppercase tracking-wider text-faint">
            Benched · {benched.length}
          </h3>
          <div className="flex flex-col gap-2">
            {benched.map((ps) => (
              <div
                key={ps.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-dashed border-border px-5 py-3"
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-faint">
                  {ps.snippet.content}
                </p>
                <button
                  onClick={() =>
                    update.mutate({ id: ps.id, patch: { included: true } })
                  }
                  className="shrink-0 text-xs text-muted transition-colors hover:text-foreground"
                >
                  Bring back
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
