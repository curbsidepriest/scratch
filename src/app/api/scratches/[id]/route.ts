import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";

/**
 * DELETE /api/scratches/:id — delete a raw session.
 *
 * Snippets are shared by reference and must never be destroyed out from under a
 * piece (spec §7). So: snippets this session produced that are already used
 * somewhere (pulled into a piece/block, or cited by a spark) are DETACHED
 * (scratchId → null) and kept; snippets used nowhere are removed with the
 * scratch. Then the scratch itself is deleted.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;

  const scratch = await prisma.scratch.findFirst({ where: { id, userId } });
  if (!scratch) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    const snippets = await tx.snippet.findMany({
      where: { scratchId: id },
      select: {
        id: true,
        _count: {
          select: {
            projectSnippets: true,
            blockSnippets: true,
            evidence: true,
          },
        },
      },
    });
    const usedElsewhere = (s: (typeof snippets)[number]) =>
      s._count.projectSnippets + s._count.blockSnippets + s._count.evidence > 0;

    const keep = snippets.filter(usedElsewhere).map((s) => s.id);
    const drop = snippets.filter((s) => !usedElsewhere(s)).map((s) => s.id);

    if (keep.length > 0) {
      // Cut loose from the deleted scratch, but preserve — a piece may use them.
      await tx.snippet.updateMany({
        where: { id: { in: keep } },
        data: { scratchId: null },
      });
    }
    if (drop.length > 0) {
      await tx.snippet.deleteMany({ where: { id: { in: drop } } });
    }
    await tx.scratch.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}
