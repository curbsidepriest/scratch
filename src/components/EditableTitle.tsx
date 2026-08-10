"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Inline, click-to-rename title. Reads as a heading at rest; hovering shows a
 * subtle surface so it's clearly editable; clicking opens a single-line input
 * (Enter saves, Esc cancels, blur saves). Stops click/navigation from leaking to
 * a parent card/link, so it can live inside a linked piece card.
 */
export function EditableTitle({
  value,
  placeholder = "Untitled",
  onSave,
  className = "",
  inputClassName = "",
}: {
  value: string | null | undefined;
  placeholder?: string;
  onSave: (next: string) => Promise<void> | void;
  className?: string;
  inputClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value ?? "");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => setText(value ?? ""), [value]);
  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  async function commit() {
    const next = text.trim();
    setEditing(false);
    if (next !== "" && next !== (value ?? "")) await onSave(next);
    else setText(value ?? "");
  }

  if (editing) {
    return (
      <input
        ref={ref}
        value={text}
        onClick={stop}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void commit();
          }
          if (e.key === "Escape") {
            setText(value ?? "");
            setEditing(false);
          }
        }}
        placeholder={placeholder}
        className={`w-full rounded-md border border-border bg-background px-1.5 py-0.5 -mx-1.5 text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-accent ${className} ${inputClassName}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        stop(e);
        setEditing(true);
      }}
      title="Rename"
      className={`-mx-1.5 max-w-full truncate rounded-md px-1.5 py-0.5 text-left transition-colors duration-150 hover:bg-foreground/[0.06] active:scale-[0.99] ${value ? "text-foreground" : "text-faint"} ${className}`}
    >
      {value || placeholder}
    </button>
  );
}
