import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/projects/:id/blocks/reorder — persist a new block order.
 * Body: { orderedIds: string[] }.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const rawIds = (body as { orderedIds?: unknown }).orderedIds;
  const orderedIds = Array.isArray(rawIds)
    ? rawIds.filter((x): x is string => typeof x === "string")
    : [];

  await prisma.$transaction(
    orderedIds.map((blockId, index) =>
      prisma.block.updateMany({
        where: { id: blockId, projectId: id },
        data: { order: index },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
