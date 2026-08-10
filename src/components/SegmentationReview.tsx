"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { commitSnippets } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import type { SegmentSuggestion } from "@/lib/types";

interface Draft {
  content: string;
  label: string;
}

/**
 * Human-in-the-loop gem review (spec §3, philosophy). The Segmenter proposes
 * 0..N GEMS extracted from the session — verbatim slices worth keeping on their
 * own. The writer confirms, drops over-eager picks, fixes labels, or rescues a
 * passage the segmenter missed. Nothing here rewrites the writer's words; the
 * full session is always preserved as its scratch regardless of what is kept.
 */
export function SegmentationReview({
  scratchId,
  suggestion,
  source,
  onDone,
}: {
  scratchId: string;
  suggestion: SegmentSuggestion;
  /** The raw session text, so the writer can lift a missed passage verbatim. */
  source?: string;
  onDone: () => void;
}) {
  const [scratchLabel, setScratchLabel] = useState(suggestion.scratchLabel);
  const [drafts, setDrafts] = useState<Draft[]>(
    suggestion.snippets.map((s) => ({ content: s.content, label: s.label })),
  );
  const [showSource, setShowSource] = useState(false);
  const [saving, setSaving] = useState(false);

  function update(i: number, patch: Partial<Draft>) {
    setDrafts((prev) => prev.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  }
  function remove(i: number) {
    setDrafts((prev) => prev.filter((_, j) => j !== i));
  }
  function addGem() {
    setDrafts((prev) => [...prev, { content: "", label: "" }]);
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

  const none = drafts.length === 0;

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
          Keep the gems
        </div>
        <p className="mb-5 text-sm text-muted">
          These are the lines worth keeping on their own — still your exact words.
          Drop anything that isn&apos;t a real gem, and add one if a good bit was
          missed. Everything else stays safe in the session either way.
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
                placeholder="paste or type the exact words of the gem"
                rows={Math.min(6, Math.max(2, Math.ceil((d.content.length || 40) / 70)))}
                className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-foreground focus:outline-none"
              />
              <div className="mt-1 flex items-center gap-3 text-[11px] text-faint">
                <Button onClick={() => remove(i)} className="!text-[11px]">
                  drop
                </Button>
              </div>
            </div>
          ))}
          {none && (
            <p className="py-6 text-center text-sm text-faint">
              No gems picked out — that&apos;s normal. Add one below if a line
              deserves it, or just leave the session whole.
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center gap-4 text-[11px] text-faint">
          <Button onClick={addGem} className="!text-[11px]">
            + add a gem
          </Button>
          {source && (
            <Button
              onClick={() => setShowSource((v) => !v)}
              className="!text-[11px]"
            >
              {showSource ? "hide session" : "view session"}
            </Button>
          )}
        </div>

        {showSource && source && (
          <p className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md bg-background p-3 text-[13px] leading-relaxed text-faint">
            {source}
          </p>
        )}

        <div className="mt-7 flex items-center justify-between">
          <span className="text-xs text-faint">
            {drafts.length} gem{drafts.length === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="md"
              onClick={onDone}
              disabled={saving}
            >
              {none ? "Leave whole" : "Not now"}
            </Button>
            <Button
              variant="solid"
              size="md"
              onClick={save}
              disabled={saving}
              pending={saving}
            >
              {saving ? "Saving…" : none ? "Done" : "Save gems"}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
