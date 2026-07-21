"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createSnippet } from "@/lib/api";
import { wordCount } from "@/lib/domain";

const DURATIONS = [10, 20, 30] as const;
const DEFAULT_MINUTES = 20;

type Phase = "setup" | "running";

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
  const [minutes, setMinutes] = useState<number>(DEFAULT_MINUTES);

  if (phase === "setup") {
    return (
      <Setup
        minutes={minutes}
        onMinutes={setMinutes}
        onBegin={() => setPhase("running")}
        onCancel={() => router.push("/")}
      />
    );
  }

  return (
    <Running
      minutes={minutes}
      onDone={async (text) => {
        const trimmed = text.trim();
        if (trimmed !== "") {
          await createSnippet({ content: trimmed, sourceMode: "dump" });
          await queryClient.invalidateQueries({ queryKey: ["snippets"] });
        }
        router.push("/");
      }}
    />
  );
}

function Setup({
  minutes,
  onMinutes,
  onBegin,
  onCancel,
}: {
  minutes: number;
  onMinutes: (m: number) => void;
  onBegin: () => void;
  onCancel: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-lg font-medium text-foreground">Timed dump</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        No going back. The timer runs, backspace is off, and you just write.
        Whatever comes out lands in the Scratchpad when the time is up.
      </p>

      <div className="mt-8">
        <div className="mb-2 text-xs text-faint">Duration</div>
        <div className="inline-flex overflow-hidden rounded-lg border border-border">
          {DURATIONS.map((m) => (
            <button
              key={m}
              onClick={() => onMinutes(m)}
              className={`px-5 py-2 text-sm transition-colors ${
                minutes === m
                  ? "bg-foreground text-background"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {m} min
            </button>
          ))}
        </div>
      </div>

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
  minutes,
  onDone,
}: {
  minutes: number;
  onDone: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [remaining, setRemaining] = useState(minutes * 60);
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

  // Countdown, computed from the start time so it can't drift.
  useEffect(() => {
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      const left = minutes * 60 - elapsed;
      setRemaining(left);
      if (left <= 0) finish();
    };
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [minutes, finish]);

  useEffect(() => {
    textRef.current?.focus();
  }, []);

  // Forward-only enforcement: accept a change ONLY if it purely appends to the
  // current text. This single rule blocks backspace, delete, cut, and both
  // select-to-replace and mid-string paste — no way to go back (spec §4).
  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    if (next.length >= text.length && next.startsWith(text)) {
      setText(next);
    }
  }

  // Crisp feedback: swallow the delete keys outright so the caret never jumps.
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
    }
  }

  const count = wordCount(text);

  return (
    <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
      {/* Unobtrusive countdown. */}
      <div className="pointer-events-none fixed right-6 top-6 z-10 tabular-nums text-sm text-faint">
        {formatClock(remaining)}
      </div>

      <textarea
        ref={textRef}
        value={text}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onCut={(e) => e.preventDefault()}
        placeholder="Go."
        className="min-h-[60vh] flex-1 resize-none bg-transparent text-lg leading-relaxed text-foreground placeholder:text-faint focus:outline-none"
      />

      <div className="mt-4 flex items-center justify-between text-xs text-faint">
        <span className="tabular-nums">
          {count > 0 ? `${count} word${count === 1 ? "" : "s"}` : " "}
        </span>
        <button
          onClick={finish}
          className="text-faint transition-colors hover:text-muted"
        >
          end &amp; save
        </button>
      </div>
    </main>
  );
}
