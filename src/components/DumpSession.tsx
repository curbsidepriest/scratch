"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createScratch, evaluateSpark } from "@/lib/api";
import { wordCount } from "@/lib/domain";
import type { SegmentSuggestion } from "@/lib/types";
import { SegmentationReview } from "./SegmentationReview";

const DURATIONS = [10, 20, 30] as const;
const WORD_TARGETS = [250, 500, 750] as const;
const DEFAULT_MINUTES = 20;
const DEFAULT_WORDS = 500;

type Goal = "time" | "words";
type Phase = "setup" | "running" | "review";

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function DumpSession() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<Phase>("setup");
  const [goal, setGoal] = useState<Goal>("time");
  const [minutes, setMinutes] = useState<number>(DEFAULT_MINUTES);
  const [wordTarget, setWordTarget] = useState<number>(DEFAULT_WORDS);
  const [noBackspace, setNoBackspace] = useState(true);
  const [review, setReview] = useState<{
    scratchId: string;
    suggestion: SegmentSuggestion;
  } | null>(null);

  async function goHome() {
    queryClient.invalidateQueries({ queryKey: ["scratches"] });
    try {
      await evaluateSpark(); // the session's snippets may have surfaced a thread
    } catch {
      // ignore — the home will still load
    }
    queryClient.invalidateQueries({ queryKey: ["spark"] });
    router.push("/");
  }

  if (phase === "setup") {
    return (
      <Setup
        goal={goal}
        setGoal={setGoal}
        minutes={minutes}
        setMinutes={setMinutes}
        wordTarget={wordTarget}
        setWordTarget={setWordTarget}
        noBackspace={noBackspace}
        setNoBackspace={setNoBackspace}
        onBegin={() => setPhase("running")}
        onCancel={() => router.push("/")}
      />
    );
  }

  if (phase === "review" && review) {
    return (
      <SegmentationReview
        scratchId={review.scratchId}
        suggestion={review.suggestion}
        onDone={goHome}
      />
    );
  }

  return (
    <Running
      goal={goal}
      minutes={minutes}
      wordTarget={wordTarget}
      noBackspace={noBackspace}
      onDone={async (text) => {
        const trimmed = text.trim();
        if (trimmed === "") {
          router.push("/");
          return;
        }
        const { id, suggestion } = await createScratch(trimmed, "dump");
        setReview({ scratchId: id, suggestion });
        setPhase("review");
      }}
    />
  );
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  render,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  render: (v: T) => string;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-border">
      {options.map((o) => (
        <button
          key={String(o)}
          onClick={() => onChange(o)}
          className={`px-5 py-2 text-sm transition-colors ${
            value === o
              ? "bg-foreground text-background"
              : "bg-surface text-muted hover:text-foreground"
          }`}
        >
          {render(o)}
        </button>
      ))}
    </div>
  );
}

/** Preset chips plus a "Custom" chip that reveals a number input. */
function ValuePicker({
  presets,
  value,
  onChange,
  unit,
  min,
}: {
  presets: readonly number[];
  value: number;
  onChange: (v: number) => void;
  unit: string;
  min: number;
}) {
  const [custom, setCustom] = useState(!presets.includes(value));

  return (
    <div>
      <div className="inline-flex overflow-hidden rounded-lg border border-border">
        {presets.map((p) => {
          const on = !custom && value === p;
          return (
            <button
              key={p}
              onClick={() => {
                setCustom(false);
                onChange(p);
              }}
              className={`px-5 py-2 text-sm transition-colors ${
                on
                  ? "bg-foreground text-background"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {p} {unit}
            </button>
          );
        })}
        <button
          onClick={() => setCustom(true)}
          className={`px-5 py-2 text-sm transition-colors ${
            custom
              ? "bg-foreground text-background"
              : "bg-surface text-muted hover:text-foreground"
          }`}
        >
          Custom
        </button>
      </div>

      {custom && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={min}
            value={value}
            autoFocus
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (!Number.isNaN(n)) onChange(Math.max(min, n));
            }}
            className="w-24 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
          />
          <span className="text-sm text-muted">{unit}</span>
        </div>
      )}
    </div>
  );
}

function Setup({
  goal,
  setGoal,
  minutes,
  setMinutes,
  wordTarget,
  setWordTarget,
  noBackspace,
  setNoBackspace,
  onBegin,
  onCancel,
}: {
  goal: Goal;
  setGoal: (g: Goal) => void;
  minutes: number;
  setMinutes: (m: number) => void;
  wordTarget: number;
  setWordTarget: (w: number) => void;
  noBackspace: boolean;
  setNoBackspace: (b: boolean) => void;
  onBegin: () => void;
  onCancel: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-lg font-medium text-foreground">Just write</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Pick a way to write and go. Whatever comes out lands in the Scratchpad
        when you finish{noBackspace ? ", and there's no going back while you write" : ""}.
      </p>

      <div className="mt-8">
        <div className="mb-2 text-xs text-faint">Write toward</div>
        <Segmented
          options={["time", "words"] as const}
          value={goal}
          onChange={setGoal}
          render={(g) => (g === "time" ? "A time" : "A word count")}
        />
      </div>

      <div className="mt-6">
        {goal === "time" ? (
          <>
            <div className="mb-2 text-xs text-faint">Duration</div>
            <ValuePicker
              presets={DURATIONS}
              value={minutes}
              onChange={setMinutes}
              unit="min"
              min={1}
            />
          </>
        ) : (
          <>
            <div className="mb-2 text-xs text-faint">Target</div>
            <ValuePicker
              presets={WORD_TARGETS}
              value={wordTarget}
              onChange={setWordTarget}
              unit="words"
              min={10}
            />
          </>
        )}
      </div>

      <button
        onClick={() => setNoBackspace(!noBackspace)}
        className="mt-6 flex items-center gap-2.5 text-left"
      >
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
            noBackspace
              ? "border-accent bg-accent text-background"
              : "border-faint text-transparent"
          }`}
          aria-hidden
        >
          ✓
        </span>
        <span className="text-sm text-muted">
          No backspace <span className="text-faint">(forward only — just keep going)</span>
        </span>
      </button>

      <div className="mt-10 flex items-center gap-4">
        <button
          onClick={onBegin}
          className="rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Begin
        </button>
        <button
          onClick={onCancel}
          className="text-sm text-faint transition-colors hover:text-muted"
        >
          Back to Scratchpad
        </button>
      </div>
    </main>
  );
}

function Running({
  goal,
  minutes,
  wordTarget,
  noBackspace,
  onDone,
}: {
  goal: Goal;
  minutes: number;
  wordTarget: number;
  noBackspace: boolean;
  onDone: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const startedAt = useRef<number>(Date.now());
  const finished = useRef(false);
  const textValue = useRef("");
  textValue.current = text;

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onDone(textValue.current);
  }, [onDone]);

  // Tick elapsed from the start time (drift-free). The goal is a SOFT signal —
  // reaching it never force-stops; you can stay in flow and finish when ready.
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    textRef.current?.focus();
  }, []);

  // Forward-only enforcement (only when enabled): accept a change ONLY if it
  // purely appends — blocks backspace, delete, cut, select-replace, mid-paste.
  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    if (!noBackspace || (next.length >= text.length && next.startsWith(text))) {
      setText(next);
    }
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (noBackspace && (e.key === "Backspace" || e.key === "Delete")) {
      e.preventDefault();
    }
  }

  const count = wordCount(text);
  const remaining = minutes * 60 - elapsed;
  const timeUp = goal === "time" && remaining <= 0;
  const wordsReached = goal === "words" && count >= wordTarget;
  const reached = timeUp || wordsReached;

  return (
    <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
      {/* Unobtrusive goal indicator. */}
      <div
        className={`pointer-events-none fixed right-6 top-6 z-10 tabular-nums text-sm ${
          reached ? "text-amber-600 dark:text-amber-500" : "text-faint"
        }`}
      >
        {goal === "time"
          ? timeUp
            ? "time's up"
            : formatClock(remaining)
          : `${count} / ${wordTarget}`}
      </div>

      <textarea
        ref={textRef}
        value={text}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onCut={(e) => noBackspace && e.preventDefault()}
        placeholder="Go."
        className="min-h-[60vh] flex-1 resize-none bg-transparent text-lg leading-relaxed text-foreground placeholder:text-faint focus:outline-none"
      />

      {reached && (
        <div className="mt-4 text-xs text-amber-600 dark:text-amber-500">
          {timeUp ? "Time's up." : "You've hit your target."} Keep going if
          you&apos;re in flow, or finish when you&apos;re ready.
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-xs text-faint">
        <span className="tabular-nums">
          {goal === "time"
            ? count > 0
              ? `${count} word${count === 1 ? "" : "s"}`
              : " "
            : formatClock(elapsed)}
        </span>
        <button
          onClick={finish}
          className="text-faint transition-colors hover:text-muted"
        >
          finish &amp; save
        </button>
      </div>
    </main>
  );
}
