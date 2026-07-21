"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { updateThroughlinePhrase } from "@/lib/api";

/**
 * The through-line as the piece's spine — click to override it with your own
 * words (spec §5/§8a: the user can always take ownership of the framing).
 */
export function EditablePhrase({
  projectId,
  throughlineId,
  phrase,
}: {
  projectId: string;
  throughlineId: string;
  phrase: string;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(phrase);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setValue(phrase), [phrase]);
  useEffect(() => {
    if (editing) {
      const el = ref.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }
  }, [editing]);

  const save = useMutation({
    mutationFn: (next: string) => updateThroughlinePhrase(throughlineId, next),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
  });

  function commit() {
    const next = value.trim();
    setEditing(false);
    if (next !== "" && next !== phrase) save.mutate(next);
    else setValue(phrase);
  }

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            setValue(phrase);
            setEditing(false);
          }
        }}
        rows={2}
        className="w-full max-w-2xl resize-none rounded-md border border-border bg-surface px-3 py-2 text-2xl leading-snug text-foreground focus:outline-none"
      />
    );
  }

  return (
    <h1
      onClick={() => setEditing(true)}
      title="Click to rewrite the spine"
      className="max-w-2xl cursor-text text-2xl leading-snug text-foreground"
    >
      {phrase}
    </h1>
  );
}
