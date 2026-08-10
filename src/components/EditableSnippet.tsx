"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/Button";

/**
 * Inline snippet editor. Snippets are the user's own words and are editable
 * anywhere they appear. Shows the text with a quiet hover "edit"; editing opens
 * an auto-growing textarea (⌘/Ctrl+Enter saves, Esc cancels).
 */
export function EditableSnippet({
  content,
  onSave,
  textClassName = "",
}: {
  content: string;
  onSave: (next: string) => Promise<void> | void;
  textClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(content);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setText(content), [content]);

  useEffect(() => {
    const el = ref.current;
    if (editing && el) {
      el.focus();
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);

  async function commit() {
    const next = text.trim();
    setEditing(false);
    if (next !== "" && next !== content) await onSave(next);
    else setText(content);
  }

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = `${e.target.scrollHeight}px`;
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            setText(content);
            setEditing(false);
          }
        }}
        className={`w-full resize-none rounded-md border border-border bg-background px-3 py-2 leading-relaxed text-foreground focus:outline-none ${textClassName}`}
      />
    );
  }

  return (
    <div className="group relative">
      <p className={`whitespace-pre-wrap ${textClassName}`}>{content}</p>
      <Button
        onClick={() => setEditing(true)}
        aria-label="Edit snippet"
        className="absolute right-0 top-0 bg-surface text-[11px] text-faint opacity-0 group-hover:opacity-100"
      >
        edit
      </Button>
    </div>
  );
}
