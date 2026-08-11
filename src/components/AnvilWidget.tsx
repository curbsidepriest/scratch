"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  fetchProjects,
  finishProject,
  releaseProject,
  setProjectDue,
} from "@/lib/api";
import { countdown, DAY_MS } from "@/lib/anvil";
import type { ProjectSummaryDTO } from "@/lib/types";
import { Button } from "./ui/Button";
import { Flame } from "./ui/Flame";

const PRESETS = [
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
];

/**
 * "On the anvil" (spec: strike while the iron's hot). A quiet home widget that
 * puts a finite, visible clock on a piece: commit a finish-by date, watch it
 * count down, and when it goes cold either ship it or let it go. If ignored, the
 * server sweep dissolves it after a short grace — the working state is finite.
 */
export function AnvilWidget() {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => Date.now());
  const [adding, setAdding] = useState(false);
  const [pick, setPick] = useState<string>("");

  // Re-render each minute so labels stay honest and cold transitions show.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const active = useMemo(
    () => projects.filter((p) => p.status === "active"),
    [projects],
  );
  const onAnvil = useMemo(
    () =>
      active
        .filter((p) => p.dueAt)
        .sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!)),
    [active],
  );
  const candidates = useMemo(
    () => active.filter((p) => !p.dueAt),
    [active],
  );

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["snippets"] });
    queryClient.invalidateQueries({ queryKey: ["spark"] });
    queryClient.invalidateQueries({ queryKey: ["sparks"] });
  };

  const setDue = useMutation({
    mutationFn: (a: { id: string; dueAt: string | null }) =>
      setProjectDue(a.id, a.dueAt),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
  const ship = useMutation({
    mutationFn: (id: string) => finishProject(id),
    onSettled: invalidateAll,
  });
  const letGo = useMutation({
    mutationFn: (id: string) => releaseProject(id),
    onSettled: invalidateAll,
  });

  function putOnAnvil(days: number) {
    const id = pick || candidates[0]?.id;
    if (!id) return;
    const dueAt = new Date(now + days * DAY_MS).toISOString();
    setDue.mutate({ id, dueAt });
    setAdding(false);
    setPick("");
  }

  // Nothing to commit to yet — stay out of the way entirely.
  if (active.length === 0) return null;

  return (
    <section className="elev mb-10 rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between gap-2 px-5 py-3">
        <h2 className="ember-tick text-[11px] uppercase tracking-wider text-muted">
          On the anvil
        </h2>
        {candidates.length > 0 && (
          <Button onClick={() => setAdding((v) => !v)} className="!text-[11px]">
            {adding ? "cancel" : onAnvil.length ? "+ add" : "+ put a piece on the anvil"}
          </Button>
        )}
      </div>

      {adding && candidates.length > 0 && (
        <div className="border-t border-border px-5 py-3">
          <p className="mb-2 text-xs text-muted">
            Commit to finishing a piece. Pick one, then a window.
          </p>
          <select
            value={pick || candidates[0]?.id}
            onChange={(e) => setPick(e.target.value)}
            className="mb-3 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            {candidates.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title || p.phrase.slice(0, 50)}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset.days}
                variant="subtle"
                onClick={() => putOnAnvil(preset.days)}
                disabled={setDue.isPending}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {onAnvil.length === 0 ? (
        !adding && (
          <p className="border-t border-border px-5 py-4 text-sm text-faint">
            Nothing committed. A piece with a finish-by date is a piece that gets
            finished, not one that quietly lingers.
          </p>
        )
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {onAnvil.map((p) => (
            <AnvilRow
              key={p.id}
              piece={p}
              now={now}
              onShip={() => ship.mutate(p.id)}
              onLetGo={() => letGo.mutate(p.id)}
              onClear={() => setDue.mutate({ id: p.id, dueAt: null })}
              shipping={ship.isPending && ship.variables === p.id}
              releasing={letGo.isPending && letGo.variables === p.id}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function AnvilRow({
  piece,
  now,
  onShip,
  onLetGo,
  onClear,
  shipping,
  releasing,
}: {
  piece: ProjectSummaryDTO;
  now: number;
  onShip: () => void;
  onLetGo: () => void;
  onClear: () => void;
  shipping: boolean;
  releasing: boolean;
}) {
  const c = countdown(piece.dueAt!, now);
  const cold = c.state === "cold";

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3">
      <span
        aria-hidden
        className={cold ? "text-faint" : "text-ember"}
        title={cold ? "Cold — ship it or let it go" : "Hot on the anvil"}
      >
        <Flame size={16} strokeWidth={1.7} />
      </span>
      <Link
        href={`/project/${piece.id}`}
        className="min-w-0 flex-1 truncate text-[15px] text-foreground transition-colors hover:text-accent"
      >
        {piece.title || piece.phrase}
      </Link>
      <span
        className={`shrink-0 text-xs font-medium tabular-nums ${
          cold
            ? "text-rose-600 dark:text-rose-400"
            : "text-amber-600 dark:text-amber-500"
        }`}
      >
        {c.label}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant={cold ? "solid" : "ghost"}
          onClick={onShip}
          pending={shipping}
          title="Mark finished — a done thing beats a perfect idea"
        >
          Ship it
        </Button>
        <Button
          variant="danger"
          onClick={onLetGo}
          pending={releasing}
          title="Dissolve gracefully — through-line and gems return"
        >
          Let go
        </Button>
        {!cold && (
          <Button
            onClick={onClear}
            className="!text-[11px]"
            title="Take off the anvil (keep the piece, drop the deadline)"
          >
            off
          </Button>
        )}
      </div>
    </li>
  );
}
