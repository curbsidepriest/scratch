"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { commitSnippets } from "@/lib/api";
import type { SegmentSuggestion } from "@/lib/types";

interface Draft {
  content: string;
  label: string;
}

/**
 * Human-in-the-loop segmentation (spec §3, philosophy). The app SUGGESTS where
 * a scratch splits into paragraph snippets and a boring descriptive label for
 * each; the writer adjusts the boundaries and labels before anything is saved.
 * Content stays the writer's verbatim words.
 */
export function SegmentationReview({
  scratchId,
  suggestion,
  onDone,
}: {
  scratchId: string;
  suggestion: SegmentSuggestion;
  onDone: () => void;
}) {
  const [scratchLabel, setScratchLabel] = useState(suggestion.scratchLabel);
  const [drafts, setDrafts] = useState<Draft[]>(
    suggestion.snippets.map((s) => ({ content: s.content, label: s.label })),
  );
  const [saving, setSaving] = useState(false);

  function update(i: number, patch: Partial<Draft>) {
    setDrafts((prev) => prev.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  }
  function remove(i: number) {
    setDrafts((prev) => prev.filter((_, j) => j !== i));
  }
  function mergeDown(i: number) {
    setDrafts((prev) => {
      if (i >= prev.length - 1) return prev;
      const merged: Draft = {
        content: `${prev[i].content}\n\n${prev[i + 1].content}`,
        label: prev[i].label,
      };
      return [...prev.slice(0, i), merged, ...prev.slice(i + 2)];
    });
  }

  async function save() {
    const kept = drafts
      .map((d) => ({ content: d.content.trim(), label: d.label.trim() }))
      .filter((d) => d.content !== "");
    if (kept.length === 0) {
      onDone();
      return;
    }
    setSaving(true);
    try {
      await commitSnippets(scratchId, scratchLabel.trim(), kept);
      onDone();
    } catch {
      setSaving(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/70 px-4 py-[6vh] backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-7 shadow-xl"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-1 text-[11px] uppercase tracking-wider text-faint">
          Break this into snippets
        </div>
        <p className="mb-5 text-sm text-muted">
          Still your words — this just proposes where they divide. Adjust the
          split, fix the labels, drop the noise.
        </p>

        <label className="mb-1 block text-[11px] uppercase tracking-wider text-faint">
          This session, in a few words
        </label>
        <input
          value={scratchLabel}
          onChange={(e) => setScratchLabel(e.target.value)}
          className="mb-6 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
        />

        <div className="flex flex-col gap-3">
          {drafts.map((d, i) => (
            <div key={i} className="rounded-lg border border-border bg-background p-3">
              <input
                value={d.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="descriptive label"
                className="mb-2 w-full bg-transparent text-xs text-muted focus:outline-none"
              />
              <textarea
                value={d.content}
                onChange={(e) => update(i, { content: e.target.value })}
                rows={Math.min(6, Math.max(2, Math.ceil(d.content.length / 70)))}
                className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-foreground focus:outline-none"
              />
              <div className="mt-1 flex items-center gap-3 text-[11px] text-faint">
                {i < drafts.length - 1 && (
                  <button onClick={() => mergeDown(i)} className="hover:text-muted">
                    merge with next
                  </button>
                )}
                <button onClick={() => remove(i)} className="hover:text-muted">
                  drop
                </button>
              </div>
            </div>
          ))}
          {drafts.length === 0 && (
            <p className="py-6 text-center text-sm text-faint">
              Nothing to keep. You can still leave the session whole.
            </p>
          )}
        </div>

        <div className="mt-7 flex items-center justify-between">
          <span className="text-xs text-faint">
            {drafts.length} snippet{drafts.length === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={onDone}
              disabled={saving}
              className="text-sm text-faint transition-colors hover:text-muted disabled:opacity-50"
            >
              Not now
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save snippets"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
