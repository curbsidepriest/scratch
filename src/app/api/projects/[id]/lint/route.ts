import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";
import { getLinterService } from "@/lib/services/linter";

// A flag's identity is (reason + normalized quote). This is what lets us honor
// "don't re-raise a dismissed flag unless the text materially changed" (§8c):
// if the flagged text changes, the quote changes, so it's a different flag.
// The quote is persisted inside the `range` JSON column.
const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const identity = (reason: string, quote: string) => `${reason}::${norm(quote)}`;

function quoteOf(range: string): string {
  try {
    return JSON.parse(range).quote ?? "";
  } catch {
    return "";
  }
}

/**
 * POST /api/projects/:id/lint — re-evaluate the stored draft and reconcile
 * flags. Idempotent: acknowledged flags are preserved (and suppress their
 * issue), everything else is recomputed from the current draft each run. So a
 * dismissed issue stays quiet unless its text materially changes, and repeated
 * or concurrent calls can't pile up duplicate flags.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const project = await prisma.project.findFirst({ where: { id, userId } });
  if (!project) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const linter = getLinterService();
  const candidates = await linter.lint(project.draft);
  const candidateByKey = new Map(
    candidates.map((c) => [identity(c.reason, c.quote), c]),
  );

  const existing = await prisma.lintFlag.findMany({ where: { projectId: id } });
  const acknowledgedKeys = new Set(
    existing
      .filter((f) => f.status === "acknowledged")
      .map((f) => identity(f.reason, quoteOf(f.range))),
  );

  await prisma.$transaction([
    // Drop the recomputed (non-acknowledged) flags…
    prisma.lintFlag.deleteMany({
      where: { projectId: id, status: { not: "acknowledged" } },
    }),
    // …and re-create an open flag for each current issue not already dismissed.
    ...[...candidateByKey]
      .filter(([k]) => !acknowledgedKeys.has(k))
      .map(([, c]) =>
        prisma.lintFlag.create({
          data: {
            projectId: id,
            range: JSON.stringify({ para: JSON.parse(c.range).para, quote: c.quote }),
            reason: c.reason,
            status: "open",
          },
        }),
      ),
  ]);

  const open = await prisma.lintFlag.findMany({
    where: { projectId: id, status: "open" },
  });
  return NextResponse.json(
    open.map((f) => ({ id: f.id, reason: f.reason, quote: quoteOf(f.range) })),
  );
}
