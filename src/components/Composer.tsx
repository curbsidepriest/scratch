"use client";

import { useEffect, useRef, useState } from "react";
import { wordCount } from "@/lib/domain";

interface ComposerProps {
  onCapture: (content: string) => void;
  /** Disable while a capture is in flight. */
  busy?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * The permanent writing surface. Cursor-ready, no naming, no commitment
 * (spec §3). ⌘/Ctrl+Enter commits the current text as a snippet.
 */
export function Composer({
  onCapture,
  busy = false,
  placeholder = "Start writing. Nothing here needs a name.",
  autoFocus = true,
}: ComposerProps) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow to fit content so the surface stays distraction-free.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  function capture() {
    const trimmed = text.trim();
    if (trimmed === "" || busy) return;
    onCapture(trimmed);
    setText("");
    ref.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      capture();
    }
  }

  const count = wordCount(text);

  return (
    <div className="w-full">
      <textarea
        ref={ref}
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none bg-transparent text-lg leading-relaxed text-foreground placeholder:text-faint focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between text-xs text-faint">
        <span className="tabular-nums">
          {count > 0 ? `${count} word${count === 1 ? "" : "s"}` : " "}
        </span>
        <span aria-hidden>
          <kbd className="font-sans">⌘</kbd>
          <kbd className="font-sans">⏎</kbd> to capture
        </span>
      </div>
    </div>
  );
}
