"use client";

import { useState } from "react";
import { Button } from "./ui/Button";

/**
 * A quiet two-step delete affordance: "delete" → "confirm / cancel". Stays out
 * of the way (matches the restraint aesthetic) and stops click/navigation from
 * leaking to a parent card or link. `onDelete` may be async; the confirm button
 * shows a spinner while it runs.
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
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <Button
          variant="danger"
          pending={busy}
          onClick={async (e) => {
            stop(e);
            setBusy(true);
            try {
              await onDelete();
            } finally {
              setBusy(false);
            }
          }}
          className="!text-red-600 dark:!text-red-400"
        >
          {busy ? "deleting…" : "confirm"}
        </Button>
        <Button
          variant="ghost"
          disabled={busy}
          onClick={(e) => {
            stop(e);
            setConfirming(false);
          }}
        >
          cancel
        </Button>
      </span>
    );
  }

  return (
    <Button
      variant="danger"
      onClick={(e) => {
        stop(e);
        setConfirming(true);
      }}
      className={className}
    >
      {idle}
    </Button>
  );
}
