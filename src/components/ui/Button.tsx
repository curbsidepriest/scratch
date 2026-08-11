"use client";

import { forwardRef, useEffect, useRef, useState } from "react";

/**
 * The one action primitive. Every clickable action uses this so the interface
 * feels haptic: an action reads as plain text at rest, gains a subtle surface on
 * hover (clearly clickable), presses in on click (active:scale), and can show a
 * quiet spinner while a slow action runs (`pending`) instead of feeling dead.
 *
 * Slow actions get instant feedback for free: if `onClick` returns a promise
 * (an LLM call, a save), the button shows the spinner and disables itself the
 * moment it's clicked, then re-enables when the promise settles. So the user
 * always sees *something* happen immediately and can't fire the action twice.
 * Pass `pending` explicitly to drive this from an external mutation instead.
 *
 * Variants:
 *   ghost  — inline text action; surface fades in on hover (the default).
 *   subtle — a bordered pill for secondary actions set a little apart.
 *   solid  — the primary filled CTA.
 *   danger — destructive; red surface fades in on hover.
 *
 * `className` is appended last so callers keep layout/positioning/visibility
 * classes (absolute, opacity-0 group-hover, etc.) without fighting the variant.
 */
export type ButtonVariant = "ghost" | "subtle" | "solid" | "danger";
export type ButtonSize = "sm" | "md";

const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-md font-medium " +
  "transition-[background-color,color,border-color,transform,opacity] duration-150 " +
  "select-none cursor-pointer " +
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent " +
  "disabled:pointer-events-none disabled:opacity-50";

// The press-scale feedback. Great on real buttons; but on a Button that fills a
// bordered card (an expand/edit toggle), scaling the fill inside the card border
// reads as a buggy "box shrinking inside a box", so those opt out via press={false}.
const PRESS = "active:scale-[0.96] disabled:active:scale-100";

const VARIANTS: Record<ButtonVariant, string> = {
  ghost:
    "text-muted hover:bg-foreground/[0.06] hover:text-foreground " +
    "dark:hover:bg-foreground/10",
  subtle:
    "border border-border text-muted hover:border-accent hover:bg-foreground/[0.04] " +
    "hover:text-foreground",
  solid:
    "bg-foreground text-background shadow-sm hover:opacity-90 active:opacity-100",
  danger:
    "text-faint hover:bg-red-500/10 hover:text-red-600 " +
    "dark:hover:text-red-400",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-2 py-1 text-xs",
  md: "px-3.5 py-1.5 text-sm",
};

// Pill variants read better fully rounded.
const RADIUS: Partial<Record<ButtonVariant, string>> = {
  subtle: "!rounded-full",
  solid: "!rounded-full",
};

function Spinner() {
  return (
    <svg
      className="h-3 w-3 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
      />
    </svg>
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Show a spinner and disable while a slow action runs. */
  pending?: boolean;
  /** Press-scale feedback on click. Off for card-shaped expand/edit toggles. */
  press?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "ghost",
      size = "sm",
      pending = false,
      press = true,
      disabled,
      type = "button",
      className = "",
      children,
      onClick,
      ...rest
    },
    ref,
  ) {
    // Auto-pending: when onClick returns a promise, spin + lock until it settles.
    const [autoPending, setAutoPending] = useState(false);
    const mounted = useRef(true);
    useEffect(() => () => {
      mounted.current = false;
    }, []);

    const busy = pending || autoPending;

    function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
      if (busy) return; // guard against double-fire while an action is in flight
      const result = onClick?.(e) as unknown;
      if (result && typeof (result as { then?: unknown }).then === "function") {
        setAutoPending(true);
        Promise.resolve(result).finally(() => {
          if (mounted.current) setAutoPending(false);
        });
      }
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || busy}
        aria-busy={busy || undefined}
        className={`${BASE} ${press ? PRESS : ""} ${VARIANTS[variant]} ${SIZES[size]} ${RADIUS[variant] ?? ""} ${busy ? "cursor-wait" : ""} ${className}`}
        onClick={handleClick}
        {...rest}
      >
        {busy && <Spinner />}
        {children}
      </button>
    );
  },
);
