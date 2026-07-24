import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";

/**
 * POST /api/projects/:id/compose — assemble the Editor draft from the current
 * Architect arrangement: every block in order, its snippets in order, released
 * from their containers into one prose draft (spec §8c, "compose" model).
 *
 * This overwrites the draft but NEVER touches the Architect side — blocks and
 * snippets are untouched, so you can rework the structure and re-compose.
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

  const blocks = await prisma.block.findMany({
    where: { projectId: id },
    orderBy: { order: "asc" },
    include: {
      blockSnippets: {
        orderBy: { order: "asc" },
        include: { snippet: true },
      },
    },
  });

  const paragraphs: string[] = [];
  for (const b of blocks) {
    for (const bs of b.blockSnippets) {
      paragraphs.push(bs.snippet.content.trim());
    }
  }
  const draft = paragraphs.join("\n\n");

  await prisma.project.update({ where: { id }, data: { draft } });
  return NextResponse.json({ draft });
}
