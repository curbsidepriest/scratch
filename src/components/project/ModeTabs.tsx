"use client";

export type Mode = "architect" | "editor";

const MODES: { key: Mode; label: string; hint: string }[] = [
  { key: "architect", label: "Architect", hint: "shape & flow" },
  { key: "editor", label: "Editor", hint: "the sentences" },
];

/** Modes are postures, not stages — non-linear, enter any from anywhere (§8). */
export function ModeTabs({
  active,
  onChange,
}: {
  active: Mode;
  onChange: (m: Mode) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
      {MODES.map((m) => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
            active === m.key
              ? "bg-foreground text-background"
              : "text-muted hover:text-foreground"
          }`}
        >
          {m.label}
          <span
            className={`ml-2 hidden text-xs sm:inline ${
              active === m.key ? "text-background/60" : "text-faint"
            }`}
          >
            {m.hint}
          </span>
        </button>
      ))}
    </div>
  );
}
