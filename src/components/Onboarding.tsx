"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "./Wordmark";

// A one-time welcome for a freshly signed-in user. Kept simple: a per-user flag
// in localStorage decides whether it's been seen, so no schema/migration. The
// three moves map to the real controls ("Just write", the spark, Pieces) so it
// orients rather than just markets.
const STEPS = [
  {
    n: "01",
    title: "Get it out",
    body: "Hit “Just write” for a timed session, or jot a quick thought in the box below. Everything you write is kept, verbatim.",
  },
  {
    n: "02",
    title: "Find the spark",
    body: "Scratch reads your writing back and surfaces the one idea worth chasing. It never writes for you.",
  },
  {
    n: "03",
    title: "Shape a piece",
    body: "Develop a spark (or “Start a piece”) into something structured. Your finished work lives under Pieces.",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

export function Onboarding() {
  const { isLoaded, user } = useUser();
  const [open, setOpen] = useState(false);

  const storageKey = user ? `scratch:onboarded:${user.id}` : null;

  useEffect(() => {
    if (!isLoaded || !storageKey) return;
    try {
      if (!localStorage.getItem(storageKey)) setOpen(true);
    } catch {
      /* localStorage unavailable — skip onboarding rather than break. */
    }
  }, [isLoaded, storageKey]);

  const dismiss = useCallback(() => {
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, "1");
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  }, [storageKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismiss]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={dismiss}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Welcome to Scratch"
            className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-7 shadow-xl"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.4, ease }}
          >
            <Wordmark />
            <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
              Welcome to Scratch
            </h2>
            <p className="mt-1 text-sm text-muted">
              A calm place to think on paper. The whole loop, in three moves.
            </p>

            <ol className="mt-6 flex flex-col gap-4">
              {STEPS.map((s) => (
                <li key={s.n} className="flex gap-3">
                  <span className="mt-0.5 font-mono text-xs text-faint">
                    {s.n}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {s.title}
                    </div>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted">
                      {s.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <Button
              onClick={dismiss}
              variant="solid"
              size="md"
              className="mt-7 w-full"
            >
              Start writing
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
