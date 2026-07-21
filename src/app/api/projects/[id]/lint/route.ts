import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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
 * flags. Returns the open flags to show. New issues → open. Issues that
 * disappeared → resolved. Dismissed issues with unchanged text → stay quiet.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const linter = getLinterService();
  const candidates = await linter.lint(project.draft);
  const candidateByKey = new Map(
    candidates.map((c) => [identity(c.reason, c.quote), c]),
  );

  const existing = await prisma.lintFlag.findMany({ where: { projectId: id } });
  const existingByKey = new Map(
    existing.map((f) => [identity(f.reason, quoteOf(f.range)), f]),
  );

  // New issues → open flags. A resolved flag whose issue returned → reopen.
  // An acknowledged flag with unchanged text is intentionally left dismissed.
  for (const [k, c] of candidateByKey) {
    const match = existingByKey.get(k);
    if (!match) {
      await prisma.lintFlag.create({
        data: {
          projectId: id,
          range: JSON.stringify({ para: JSON.parse(c.range).para, quote: c.quote }),
          reason: c.reason,
          status: "open",
        },
      });
    } else if (match.status === "resolved") {
      await prisma.lintFlag.update({
        where: { id: match.id },
        data: { status: "open" },
      });
    }
  }

  // Open flags whose issue is gone (the writer fixed it) → resolved.
  for (const [k, f] of existingByKey) {
    if (f.status === "open" && !candidateByKey.has(k)) {
      await prisma.lintFlag.update({
        where: { id: f.id },
        data: { status: "resolved" },
      });
    }
  }

  const open = await prisma.lintFlag.findMany({
    where: { projectId: id, status: "open" },
  });
  return NextResponse.json(
    open.map((f) => ({ id: f.id, reason: f.reason, quote: quoteOf(f.range) })),
  );
}
