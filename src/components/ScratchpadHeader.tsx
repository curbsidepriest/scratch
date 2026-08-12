"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import type { StreakInfo } from "@/lib/streak";
import { Wordmark } from "./Wordmark";
import { Button } from "./ui/Button";
import { Flame } from "./ui/Flame";

/**
 * The Scratchpad's top bar. Packs the wordmark, the streak, the library links
 * and the two creative actions. On a phone that's too much for one row, so it
 * splits: the wordmark + streak + account sit on top, and the links/actions
 * wrap onto their own line beneath — never overflowing or blowing up.
 */
export function ScratchpadHeader({
  streak,
  onStartPiece,
}: {
  streak: StreakInfo;
  onStartPiece: () => void;
}) {
  return (
    <header className="mb-8 flex flex-col gap-x-4 gap-y-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Top cluster: wordmark + streak, with the account tucked to the far
          right on mobile (it moves into the nav on wider screens). */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Wordmark />
          <span
            title={
              streak.streak > 0
                ? `${streak.streak}-day writing streak${
                    streak.best > streak.streak ? ` · best ${streak.best}` : ""
                  }`
                : "No streak yet — write today to start one"
            }
            className={`flex items-center gap-1 text-xs font-medium tabular-nums transition-colors ${
              streak.writtenToday ? "text-ember" : "text-faint"
            }`}
          >
            <Flame size={14} strokeWidth={1.7} />
            {streak.streak}
          </span>
        </div>
        <div className="sm:hidden">
          <UserButton />
        </div>
      </div>

      {/* Links + actions. Wrap and stay right-aligned; on mobile they flow onto
          their own line below the wordmark. */}
      <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:justify-end">
        <Link
          href="/gems"
          className="text-xs text-faint transition-colors hover:text-foreground"
        >
          Gems
        </Link>
        <Link
          href="/sparks"
          className="text-xs text-faint transition-colors hover:text-foreground"
        >
          Sparks
        </Link>
        <Link
          href="/pieces"
          className="text-xs text-faint transition-colors hover:text-foreground"
        >
          Pieces
        </Link>
        <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />
        {/* A hairline separates the library links from the actions on mobile,
            where they share a wrapped row. */}
        <span className="mx-0.5 h-4 w-px bg-border sm:hidden" aria-hidden />
        <Button variant="subtle" size="md" onClick={onStartPiece}>
          Start a piece
        </Button>
        <Link
          href="/dump"
          className="rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
        >
          Just write
        </Link>
        <span className="hidden sm:block">
          <UserButton />
        </span>
      </nav>
    </header>
  );
}
