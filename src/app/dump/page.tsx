import { DumpSession } from "@/components/DumpSession";

// Timed Dump mode (spec §4): a focused sprint. The timer and the disabled
// backspace are the whole game — no points, streaks, or badges.
export default function DumpPage() {
  return <DumpSession />;
}
