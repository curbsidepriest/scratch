"use client";

import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { fetchRelevant, promoteThroughline } from "@/lib/api";
import { Button } from "@/components/ui/Button";

function excerpt(text: string, max = 120): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max).trimEnd()}…`;
}

interface PromotionOverlayProps {
  throughlineId: string;
  phrase: string;
  onCancel: () => void;
  onPromoted: (projectId: string) => void;
}

/**
 * The promotion moment (spec §6, must-feel-great #2). The through-line becomes
 * a piece; relevant snippets are pulled in as SHARED references and the user
 * curates keep/drop. Deliberate, not an instant page-swap.
 */
export function PromotionOverlay({
  throughlineId,
  phrase,
  onCancel,
  onPromoted,
}: PromotionOverlayProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["relevant", throughlineId],
    queryFn: () => fetchRelevant(throughlineId),
  });

  // All snippets, suggested first (the API sorts them). The user picks freely —
  // essential when there's no spark and nothing is suggested.
  const all = useMemo(() => data?.snippets ?? [], [data]);

  const [kept, setKept] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  // Default to keeping everything the Ranker suggested, once loaded.
  useEffect(() => {
    const suggested = all.filter((s) => s.suggested);
    if (suggested.length > 0) setKept(new Set(suggested.map((s) => s.id)));
  }, [all]);

  function toggle(id: string) {
    setKept((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function create() {
    setCreating(true);
    try {
      const { id } = await promoteThroughline(throughlineId, [...kept]);
      onPromoted(id);
    } catch {
      setCreating(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/70 px-4 py-[8vh] backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onCancel}
    >
      <motion.div
        className="w-full max-w-xl rounded-2xl border border-border bg-surface p-7 shadow-xl"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 text-[11px] uppercase tracking-wider text-faint">
          Becoming a piece
        </div>
        <p className="text-lg leading-relaxed text-foreground">{phrase}</p>
        <p className="mt-3 text-sm text-muted">
          Pick what belongs. Nothing is moved — these stay in your Scratchpad and
          can feed another piece later.
        </p>

        <div className="mt-6 flex max-h-[46vh] flex-col gap-2 overflow-y-auto pr-1">
          {isLoading && (
            <p className="py-6 text-center text-sm text-faint">
              Gathering your snippets…
            </p>
          )}
          {!isLoading && all.length === 0 && (
            <p className="py-6 text-center text-sm text-faint">
              No snippets yet — write something first.
            </p>
          )}
          {all.map((s) => {
            const on = kept.has(s.id);
            return (
              <Button
                key={s.id}
                variant="ghost"
                onClick={() => toggle(s.id)}
                className={`!rounded-lg border !px-4 !py-3 text-left ${
                  on ? "border-accent/40 bg-background" : "border-border bg-transparent opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                      on ? "border-accent bg-accent text-background" : "border-faint text-transparent"
                    }`}
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span className="min-w-0">
                    {s.label && (
                      <span className="mb-0.5 block text-[10px] uppercase tracking-wider text-faint">
                        {s.label}
                      </span>
                    )}
                    <span className="block text-sm text-foreground">
                      {excerpt(s.content)}
                    </span>
                    {s.suggested && s.reason && (
                      <span className="mt-1 block text-xs text-faint">
                        {s.reason}
                      </span>
                    )}
                  </span>
                </div>
              </Button>
            );
          })}
        </div>

        <div className="mt-7 flex items-center justify-between">
          <span className="text-xs text-faint">
            {kept.size} snippet{kept.size === 1 ? "" : "s"} coming with it
          </span>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="md"
              onClick={onCancel}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              size="md"
              onClick={create}
              disabled={creating || isLoading}
              pending={creating}
            >
              {creating ? "Creating…" : "Develop this"}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
