"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import type { DayCell, StreakInfo } from "@/lib/streak";
import { Button } from "@/components/ui/Button";

function WeekStrip({ week }: { week: DayCell[] }) {
  return (
    <div className="mt-3 flex items-center gap-1.5">
      {week.map((d) => (
        <div key={d.key} className="flex flex-col items-center gap-1">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
              d.written
                ? "bg-orange-500 text-white"
                : d.isToday
                  ? "border border-dashed border-accent text-faint"
                  : "border border-border text-faint"
            }`}
            title={d.key}
          >
            {d.written ? "🔥" : ""}
          </span>
          <span className={`text-[10px] ${d.isToday ? "text-foreground" : "text-faint"}`}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * The daily-writing nudge. When you haven't written today it's a strong, juicy
 * call to action to protect the streak; once you have, it's a quiet, warm
 * confirmation. Lives on the home screen — the writing sprint itself stays calm.
 */
export function StreakBanner({
  info,
  onStart,
}: {
  info: StreakInfo;
  onStart: () => void;
}) {
  const { writtenToday, streak, best, week } = info;

  // Let the user hide the CTA for the rest of the day (it returns tomorrow).
  // The permanent flame in the header is the always-on streak display.
  const { user } = useUser();
  const hideKey = user
    ? `scratch:streak-cta-hidden:${user.id}:${info.todayKey}`
    : null;
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (!hideKey) return;
    try {
      setHidden(!!localStorage.getItem(hideKey));
    } catch {
      /* localStorage unavailable — just show it */
    }
  }, [hideKey]);

  function hideForToday() {
    if (hideKey) {
      try {
        localStorage.setItem(hideKey, "1");
      } catch {
        /* ignore */
      }
    }
    setHidden(true);
  }

  if (!writtenToday) {
    if (hidden) return null;
    return (
      <motion.section
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 overflow-hidden rounded-2xl border border-orange-500/40 bg-gradient-to-br from-orange-500/[0.08] to-transparent"
      >
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
              <span className="text-2xl">🔥</span>
              {streak > 0
                ? `Keep your ${streak}-day streak alive`
                : "Write today — start your streak"}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {streak > 0
                ? "You haven't written yet today. Five minutes is all it takes to keep the chain going."
                : "Show up for five minutes. Then again tomorrow. That's the whole trick."}
            </p>
            <WeekStrip week={week} />
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <motion.button
              onClick={onStart}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-full bg-foreground px-6 py-3.5 text-sm font-semibold text-background shadow-sm"
            >
              Write for 5 minutes →
            </motion.button>
            <Button
              onClick={hideForToday}
              variant="ghost"
              className="!text-[11px]"
            >
              hide for today
            </Button>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <section className="mb-8 rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="text-lg">🔥</span>
            {streak > 1 ? `${streak}-day streak` : "You wrote today"}
            <span className="text-faint">· done for today</span>
            {best > streak && (
              <span className="text-faint">· best {best}</span>
            )}
          </div>
          <WeekStrip week={week} />
        </div>
        <Button
          onClick={onStart}
          variant="subtle"
          size="sm"
          className="shrink-0"
        >
          Write again
        </Button>
      </div>
    </section>
  );
}
