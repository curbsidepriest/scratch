import Link from "next/link";

/**
 * The Scratch wordmark — a small logo chip (a few scratch strokes) beside the
 * name. Understated but crafted, so the app reads as a product, not a page
 * heading. Links home.
 */
export function Wordmark() {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background transition-transform group-hover:-rotate-6">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path
            d="M2 9.5 L6 3 M5 10.8 L9.4 2.6 M8 11 L12 4.8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        Scratch
      </span>
    </Link>
  );
}
