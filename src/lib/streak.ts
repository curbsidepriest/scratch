// Streak maths for the daily-writing habit. Derived entirely from the
// timestamps of what you've already written (Scratch.createdAt) — no new
// storage — and computed in the browser's LOCAL timezone so "today" means your
// today, not UTC's.

export interface DayCell {
  key: string; // local YYYY-MM-DD
  label: string; // narrow weekday, e.g. "M"
  written: boolean;
  isToday: boolean;
}

export interface StreakInfo {
  writtenToday: boolean;
  streak: number; // current run of consecutive days, through today (or yesterday if today's still open)
  best: number; // longest run ever
  week: DayCell[]; // the last 7 days, oldest → today
  todayKey: string; // local YYYY-MM-DD, e.g. for a per-day dismissal key
}

function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function computeStreak(
  isoTimestamps: string[],
  now: Date = new Date(),
): StreakInfo {
  const days = new Set(
    isoTimestamps.map((iso) => localDayKey(new Date(iso))),
  );

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todayKey = localDayKey(today);
  const writtenToday = days.has(todayKey);

  // Current streak: count back from today (or from yesterday if today is still
  // open, so the streak stays "alive" until midnight).
  let streak = 0;
  const cursor = new Date(today);
  if (!writtenToday) cursor.setDate(cursor.getDate() - 1);
  while (days.has(localDayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Best streak ever: walk the sorted distinct days.
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of [...days].sort()) {
    const d = new Date(`${key}T00:00:00`);
    if (prev) {
      const diff = Math.round((d.getTime() - prev.getTime()) / 86_400_000);
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = d;
  }

  const week: DayCell[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    week.push({
      key: localDayKey(d),
      label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
      written: days.has(localDayKey(d)),
      isToday: i === 0,
    });
  }

  return { writtenToday, streak, best, week, todayKey };
}
