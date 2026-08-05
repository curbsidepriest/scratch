import { DumpSession } from "@/components/DumpSession";

// Timed Dump mode (spec §4): a focused sprint. The sprint itself stays calm —
// the streak/habit mechanics live on the home screen, not in here. ?quick=1
// (from the home CTA) drops straight into a 5-minute session.
export default async function DumpPage({
  searchParams,
}: {
  searchParams: Promise<{ quick?: string }>;
}) {
  const sp = await searchParams;
  return <DumpSession quickStart={sp.quick === "1"} />;
}
