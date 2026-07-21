"use client";

import { motion } from "motion/react";
import type { SparkDTO } from "@/lib/types";

function excerpt(text: string, max = 90): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max).trimEnd()}…`;
}

interface SparkProps {
  spark: SparkDTO;
  onDismiss: () => void;
  dismissing?: boolean;
}

/**
 * The spark (spec §5). It surfaces rarely, so it should feel like a rare
 * visitor: quiet, distinct, tentative. It names territory and points at the
 * writer's own words — it never praises or prescribes.
 */
export function Spark({ spark, onDismiss, dismissing = false }: SparkProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-xl border border-border bg-surface"
    >
      <div className="border-l-2 border-accent px-5 py-4">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-faint">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          a thread, maybe
        </div>

        <p className="text-[17px] leading-relaxed text-foreground">
          {spark.phrase}
        </p>

        <ul className="mt-4 flex flex-col gap-2.5">
          {spark.evidence.map((e) => (
            <li key={e.id} className="text-sm">
              <span className="text-muted">{e.observation}</span>
              <span className="mt-0.5 block border-l border-border pl-3 text-[13px] italic text-faint">
                {excerpt(e.snippet.content)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center gap-4">
          {/* "Develop this →" (promotion) arrives in Phase 5. */}
          <button
            onClick={onDismiss}
            disabled={dismissing}
            className="text-xs text-faint transition-colors hover:text-muted disabled:opacity-50"
          >
            Not now
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
