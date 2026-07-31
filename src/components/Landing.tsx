"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { motion } from "motion/react";
import { Wordmark } from "./Wordmark";

// The public front door. Signed-out visitors land here; signing in swaps them
// into the Scratchpad. Restraint is still the aesthetic (spec §4) — crafted and
// quietly animated, not loud. The three pillars mirror the real app flow:
// Dump (get it out) → Spark (find what matters) → Architect (shape a piece).
const PILLARS = [
  {
    step: "01",
    name: "Dump",
    body: "A timed, no-backspace canvas. Get everything out of your head before you let yourself judge a word of it.",
  },
  {
    step: "02",
    name: "Spark",
    body: "The model reads what you wrote back and surfaces the one line worth chasing. It never writes for you.",
  },
  {
    step: "03",
    name: "Architect",
    body: "Promote a spark into a piece, then shape your raw snippets into something that finally has a shape.",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

export function Landing() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <BackgroundStrokes />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <Wordmark />
        <nav className="flex items-center gap-1 sm:gap-2">
          <SignInButton mode="modal">
            <button className="rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-sm transition-transform hover:-translate-y-0.5">
              Get started
            </button>
          </SignUpButton>
        </nav>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3.5 py-1.5 text-xs font-medium tracking-wide text-muted backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          A writing tool that helps you think
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.05 }}
          className="max-w-3xl text-balance text-5xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-7xl"
        >
          Write to think.
          <br />
          <span className="text-muted">Never think for you.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.12 }}
          className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-muted"
        >
          Scratch is a calm place to dump raw thought, find the one idea worth
          chasing, and shape it into a piece. The model reads you back. It never
          writes for you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.2 }}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          <SignUpButton mode="modal">
            <button className="rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-sm transition-transform hover:-translate-y-0.5">
              Start writing — it&apos;s free
            </button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button className="rounded-full px-6 py-3 text-sm font-semibold text-muted transition-colors hover:text-foreground">
              I already have an account
            </button>
          </SignInButton>
        </motion.div>

        <div className="mt-20 grid w-full max-w-4xl gap-4 sm:mt-28 sm:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: 0.32 + i * 0.08 }}
              className="rounded-2xl border border-border bg-surface/60 p-6 text-left backdrop-blur transition-colors hover:border-accent/40"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span className="font-mono text-xs text-faint">{p.step}</span>
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  {p.name}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 flex flex-col items-center gap-1 px-6 py-8 text-center text-xs text-faint">
        <p>Scratch · thinking out loud, on paper.</p>
      </footer>
    </div>
  );
}

// A few oversized versions of the wordmark's scratch strokes, drawn in as the
// page loads — the logo motif, blown up into wallpaper.
function BackgroundStrokes() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full text-accent/10"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1000 700"
      fill="none"
    >
      {[
        "M120 620 L360 120",
        "M300 660 L620 60",
        "M540 640 L820 120",
        "M720 660 L940 200",
      ].map((d, i) => (
        <motion.path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease, delay: 0.15 * i }}
        />
      ))}
    </svg>
  );
}
