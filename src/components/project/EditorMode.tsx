"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { composeDraft, runLint, saveDraft, setLintFlagStatus } from "@/lib/api";
import type { LintFlagDTO, ProjectSnippetDTO } from "@/lib/types";
import { Button } from "../ui/Button";

export function EditorMode({
  projectId,
  initialDraft,
  snippets,
}: {
  projectId: string;
  initialDraft: string;
  snippets: ProjectSnippetDTO[];
}) {
  const [draft, setDraft] = useState(initialDraft);
  const [flags, setFlags] = useState<LintFlagDTO[]>([]);
  const [checking, setChecking] = useState(false);
  const [touched, setTouched] = useState(false);
  const [confirmingCompose, setConfirmingCompose] = useState(false);
  const [composing, setComposing] = useState(false);
  const [showFlags, setShowFlags] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
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

  useEffect(() => {
    void check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!touched) return;
    const t = setTimeout(() => void check(), 1200);
    return () => clearTimeout(t);
  }, [draft, touched, check]);

  async function acknowledge(id: string) {
    setFlags((prev) => prev.filter((f) => f.id !== id));
    await setLintFlagStatus(id, "acknowledged");
    void check();
  }

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

  async function compose() {
    setConfirmingCompose(false);
    setComposing(true);
    try {
      const { draft: next } = await composeDraft(projectId);
      setDraft(next);
      await check();
    } finally {
      setComposing(false);
    }
  }
  function onComposeClick() {
    if (draft.trim() !== "") setConfirmingCompose(true);
    else void compose();
  }

  // Pull a snippet into the draft at the cursor — the writer's own words,
  // released into the prose they're actively shaping.
  function insertSnippet(content: string) {
    const el = textRef.current;
    const pos = el ? el.selectionStart : draft.length;
    const before = draft.slice(0, pos);
    const after = draft.slice(pos);
    const sep = before && !before.endsWith("\n\n") ? "\n\n" : "";
    const next = `${before}${sep}${content}${after}`;
    setDraft(next);
    setTouched(true);
    requestAnimationFrame(() => {
      if (el) {
        el.focus();
        const caret = (before + sep + content).length;
        el.setSelectionRange(caret, caret);
      }
    });
  }

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="mr-auto text-[11px] uppercase tracking-wider text-faint">
            The sentences
          </h2>
          <Button
            onClick={onComposeClick}
            pending={composing}
          >
            {composing ? "composing…" : "Compose from Architect"}
          </Button>
          <Button onClick={() => void check()}>
            {checking ? "checking…" : "Re-check"}
          </Button>
          <Button
            onClick={() => setShowSnippets((v) => !v)}
            className={showSnippets ? "!text-foreground" : ""}
          >
            Snippets
          </Button>
          <Button
            onClick={() => setShowFlags((v) => !v)}
            className={showFlags ? "!text-foreground" : ""}
          >
            Flags
            {flags.length > 0 && (
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-500">
                {flags.length}
              </span>
            )}
          </Button>
        </div>

        {confirmingCompose && (
          <div className="mb-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
            <p className="text-foreground">
              Replace the current draft with a fresh compose from Architect?
            </p>
            <p className="mt-1 text-xs text-muted">
              Your Architect arrangement stays untouched — only this draft is
              overwritten.
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <Button variant="solid" onClick={() => void compose()}>
                Replace draft
              </Button>
              <Button onClick={() => setConfirmingCompose(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {draft.trim() === "" && !confirmingCompose && (
          <div className="mb-3 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-faint">
            Nothing composed yet.{" "}
            <Button
              onClick={onComposeClick}
              className="!px-0 !py-0 underline decoration-dotted"
            >
              Compose from Architect
            </Button>{" "}
            to release your arranged snippets into a draft, or just start typing.
          </div>
        )}

        <textarea
          ref={textRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setTouched(true);
          }}
          placeholder="Start shaping the actual sentences…"
          className="min-h-[68vh] w-full resize-none rounded-lg border border-border bg-surface p-5 text-[16px] leading-relaxed text-foreground placeholder:text-faint focus:outline-none"
        />
      </div>

      {showSnippets && (
        <aside className="w-72 shrink-0">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[11px] uppercase tracking-wider text-faint">
              Snippets
            </h3>
            <Button
              onClick={() => setShowSnippets(false)}
              className="!text-[11px]"
            >
              close
            </Button>
          </div>
          <p className="mb-3 text-xs text-faint">Click to drop into the draft.</p>
          <ul className="flex flex-col gap-2">
            {snippets.map((ps) => (
              <li key={ps.snippet.id}>
                <Button
                  variant="subtle"
                  onClick={() => insertSnippet(ps.snippet.content)}
                  className="w-full !rounded-md !justify-start !px-3 !py-2 text-left hover:!border-accent/50"
                >
                  {ps.snippet.label && (
                    <span className="mb-1 block text-[10px] uppercase tracking-wider text-faint">
                      {ps.snippet.label}
                    </span>
                  )}
                  <span className="line-clamp-3 text-xs leading-snug text-muted">
                    {ps.snippet.content}
                  </span>
                </Button>
              </li>
            ))}
            {snippets.length === 0 && (
              <li className="text-xs text-faint">No snippets in this piece.</li>
            )}
          </ul>
        </aside>
      )}

      {showFlags && (
        <aside className="w-80 shrink-0">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[11px] uppercase tracking-wider text-faint">
              Flags {flags.length > 0 && `· ${flags.length}`}
            </h3>
            <Button
              onClick={() => setShowFlags(false)}
              className="!text-[11px]"
            >
              close
            </Button>
          </div>
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
                    <Button onClick={() => fixMyself(f.quote)}>
                      Fix it myself
                    </Button>
                    <Button onClick={() => acknowledge(f.id)}>
                      Acknowledge &amp; dismiss
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}
    </div>
  );
}
