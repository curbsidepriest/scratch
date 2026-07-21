"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { runLint, saveDraft, setLintFlagStatus } from "@/lib/api";
import type { LintFlagDTO } from "@/lib/types";

export function EditorMode({
  projectId,
  initialDraft,
}: {
  projectId: string;
  initialDraft: string;
}) {
  const [draft, setDraft] = useState(initialDraft);
  const [flags, setFlags] = useState<LintFlagDTO[]>([]);
  const [checking, setChecking] = useState(false);
  const [touched, setTouched] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  // Only the most recent lint response may update the UI, so a slow/stale run
  // can't clobber a newer one (e.g. re-adding a just-acknowledged flag).
  const runSeq = useRef(0);

  const check = useCallback(async () => {
    const mine = ++runSeq.current;
    setChecking(true);
    try {
      await saveDraft(projectId, textRef.current?.value ?? draft);
      const next = await runLint(projectId);
      if (mine === runSeq.current) setFlags(next);
    } finally {
      if (mine === runSeq.current) setChecking(false);
    }
  }, [projectId, draft]);

  // Lint once on open (in case a draft already exists).
  useEffect(() => {
    void check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced re-check as the writer edits.
  useEffect(() => {
    if (!touched) return;
    const t = setTimeout(() => void check(), 1200);
    return () => clearTimeout(t);
  }, [draft, touched, check]);

  async function acknowledge(id: string) {
    setFlags((prev) => prev.filter((f) => f.id !== id));
    await setLintFlagStatus(id, "acknowledged");
    // Re-lint now that it's dismissed; with unchanged text it won't re-raise.
    void check();
  }

  // "Fix it myself" — jump to the flagged text so the writer can edit it. The
  // tool never supplies the fix (spec §8c).
  function fixMyself(quote: string) {
    const el = textRef.current;
    if (!el) return;
    const idx = el.value.indexOf(quote.slice(0, 40));
    el.focus();
    if (idx >= 0) {
      el.setSelectionRange(idx, idx + quote.length);
      const ratio = idx / Math.max(1, el.value.length);
      el.scrollTop = ratio * el.scrollHeight - el.clientHeight / 2;
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1">
        <h2 className="mb-1 text-[11px] uppercase tracking-wider text-faint">
          The sentences
        </h2>
        <p className="mb-4 text-sm text-muted">
          Write the piece here. The linter points at what&apos;s off — it never
          fixes it for you.
        </p>
        <textarea
          ref={textRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setTouched(true);
          }}
          placeholder="Start shaping the actual sentences…"
          className="min-h-[50vh] w-full resize-none rounded-lg border border-border bg-surface p-4 text-[15px] leading-relaxed text-foreground placeholder:text-faint focus:outline-none"
        />
        <div className="mt-2 flex items-center gap-3 text-xs text-faint">
          <button
            onClick={() => void check()}
            className="transition-colors hover:text-foreground"
          >
            Re-check
          </button>
          {checking && <span>checking…</span>}
        </div>
      </div>

      <aside className="w-full shrink-0 lg:w-80">
        <h3 className="mb-3 text-[11px] uppercase tracking-wider text-faint">
          Flags {flags.length > 0 && `· ${flags.length}`}
        </h3>
        {flags.length === 0 ? (
          <p className="text-sm text-faint">
            Quiet for now. The linter stays out of the way until there&apos;s
            enough to react to.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {flags.map((f) => (
              <li
                key={f.id}
                className="rounded-lg border border-l-2 border-border border-l-amber-500 bg-surface px-4 py-3"
              >
                <p className="text-sm text-foreground">{f.reason}</p>
                <p className="mt-2 border-l border-border pl-2 text-xs italic text-faint">
                  {f.quote.length > 100 ? `${f.quote.slice(0, 100)}…` : f.quote}
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs">
                  <button
                    onClick={() => fixMyself(f.quote)}
                    className="text-muted transition-colors hover:text-foreground"
                  >
                    Fix it myself
                  </button>
                  <button
                    onClick={() => acknowledge(f.id)}
                    className="text-faint transition-colors hover:text-muted"
                  >
                    Acknowledge &amp; dismiss
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
