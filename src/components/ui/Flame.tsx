/**
 * The flame. Drawn as line-art in the same pen-stroke language as the Wordmark
 * (round caps, 1.5-ish stroke) so the streak, the anvil and the logo all read
 * as one hand — the coloured emoji 🔥 always looked pasted-in from another
 * design. Inherits `currentColor`, so the caller decides the heat: ember when
 * live, faint when dormant.
 */
export function Flame({
  size = 16,
  strokeWidth = 1.6,
  className = "",
}: {
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
