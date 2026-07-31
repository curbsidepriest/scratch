"use client";

import { useState } from "react";

/**
 * A quiet two-step delete affordance: "delete" → "confirm / cancel". Stays out
 * of the way (matches the restraint aesthetic) and stops click/navigation from
 * leaking to a parent card or link. `onDelete` may be async; it shows "deleting…"
 * while it runs.
 */
export function DeleteControl({
  onDelete,
  idle = "delete",
  className = "",
}: {
  onDelete: () => Promise<void> | void;
  idle?: string;
  className?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (confirming) {
    return (
      <span className={`inline-flex items-center gap-2 text-[11px] ${className}`}>
        <button
          disabled={busy}
          onClick={async (e) => {
            stop(e);
            setBusy(true);
            try {
              await onDelete();
            } finally {
              setBusy(false);
            }
          }}
          className="font-medium text-red-600 transition-colors hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
        >
          {busy ? "deleting…" : "confirm"}
        </button>
        <button
          disabled={busy}
          onClick={(e) => {
            stop(e);
            setConfirming(false);
          }}
          className="text-faint transition-colors hover:text-muted"
        >
          cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={(e) => {
        stop(e);
        setConfirming(true);
      }}
      className={`text-[11px] text-faint transition-colors hover:text-red-600 dark:hover:text-red-400 ${className}`}
    >
      {idle}
    </button>
  );
}
