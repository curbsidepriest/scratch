// Pure, client-safe helpers for the "on the anvil" countdown. No server deps, so
// both the UI and the server-side sweep can share GRACE_MS.

export const DAY_MS = 24 * 60 * 60 * 1000;
// A cold piece lingers this long before it auto-releases.
export const GRACE_MS = 2 * DAY_MS;

export interface Countdown {
  state: "hot" | "cold";
  msToDue: number; // to dueAt (negative once past)
  msToDissolve: number; // to dueAt + grace (negative once it would be swept)
  label: string;
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

export function countdown(dueAtIso: string, now: number): Countdown {
  const due = new Date(dueAtIso).getTime();
  const msToDue = due - now;
  const msToDissolve = due + GRACE_MS - now;

  if (msToDue > 0) {
    // Hot — still time on the clock.
    const days = Math.ceil(msToDue / DAY_MS);
    const label =
      msToDue <= DAY_MS
        ? "due today"
        : `${plural(days, "day")} left`;
    return { state: "hot", msToDue, msToDissolve, label };
  }

  // Cold — past due, counting down the grace before it dissolves.
  if (msToDissolve <= 0) {
    return { state: "cold", msToDue, msToDissolve, label: "dissolving…" };
  }
  const graceDays = Math.ceil(msToDissolve / DAY_MS);
  const label =
    msToDissolve <= DAY_MS
      ? "cold · dissolves today"
      : `cold · ${plural(graceDays, "day")} to decide`;
  return { state: "cold", msToDue, msToDissolve, label };
}
