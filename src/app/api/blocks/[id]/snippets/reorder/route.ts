import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";

/**
 * POST /api/blocks/:id/snippets/reorder — persist a new order for the snippets
 * within a block. Body: { orderedSnippetIds: string[] }.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id: blockId } = await params;
  const block = await prisma.block.findFirst({
    where: { id: blockId, project: { userId } },
    select: { id: true },
  });
  if (!block) return NextResponse.json({ error: "not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const raw = (body as { orderedSnippetIds?: unknown }).orderedSnippetIds;
  const ordered = Array.isArray(raw)
    ? raw.filter((x): x is string => typeof x === "string")
    : [];

  await prisma.$transaction(
    ordered.map((snippetId, index) =>
      prisma.blockSnippet.updateMany({
        where: { blockId, snippetId },
        data: { order: index },
      }),
    ),
  );
  return NextResponse.json({ ok: true });
}
