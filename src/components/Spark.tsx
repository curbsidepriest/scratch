"use client";

import { motion } from "motion/react";
import { useState } from "react";
import type { SparkDTO } from "@/lib/types";
import { Button } from "./ui/Button";

function excerpt(text: string, max = 90): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max).trimEnd()}…`;
}

interface SparkProps {
  spark: SparkDTO;
  onDevelop: () => void;
  onDismiss: () => void;
  dismissing?: boolean;
}

/**
 * The spark (spec §5). It surfaces rarely, so it should feel like a rare
 * visitor: quiet, distinct, tentative. It opens as a teaser — the title and the
 * territory phrase — and expands on a tap to show the evidence (the writer's own
 * words) and the develop / not-now actions, so it never dominates the Scratchpad.
 */
export function Spark({
  spark,
  onDevelop,
  onDismiss,
  dismissing = false,
}: SparkProps) {
  const [expanded, setExpanded] = useState(false);
  const count = spark.evidence.length;

  return (
    <motion.aside
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="elev overflow-hidden rounded-xl border border-ember-soft/40 bg-gradient-to-br from-ember-bright/[0.05] to-surface"
    >
      <div className="border-l-2 border-ember-bright">
        {/* Teaser header — the whole thing toggles the detail open/closed. */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex w-full items-start gap-3 px-5 py-4 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-ember">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-ember-bright" />
              {spark.title ?? "a thread, maybe"}
            </div>
            <p className="text-[17px] leading-relaxed text-foreground">
              {spark.phrase}
            </p>
            {!expanded && (
              <p className="mt-2 text-xs text-faint">
                {count} place{count === 1 ? "" : "s"} it shows up · tap to open
              </p>
            )}
          </div>
          <span className="mt-1 shrink-0 text-ember/70" aria-hidden>
            {expanded ? "▾" : "▸"}
          </span>
        </button>

        {expanded && (
          <div className="px-5 pb-4">
            <ul className="flex flex-col gap-2.5">
              {spark.evidence.map((e) => (
                <li key={e.id} className="text-sm">
                  <span className="text-muted">{e.observation}</span>
                  <span className="mt-0.5 block border-l border-border pl-3 text-[13px] italic text-faint">
                    {excerpt(e.snippet.content)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center gap-4">
              <Button variant="solid" size="md" onClick={onDevelop}>
                Develop this →
              </Button>
              <Button onClick={onDismiss} disabled={dismissing}>
                Not now
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
