import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";

/**
 * PATCH /api/blocks/:id — edit a block's label/body, or fill it from a snippet
 * (spec §8b). Setting a snippet marks the block "filled".
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const existing = await prisma.block.findFirst({
    where: { id, project: { userId } },
  });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const { label, body: text } = body as {
    label?: unknown;
    body?: unknown;
  };

  const data: { label?: string; body?: string | null } = {};
  if (typeof label === "string" && label.trim() !== "") data.label = label.trim();
  if (typeof text === "string") data.body = text;
  if (text === null) data.body = null;

  const updated = await prisma.block.update({ where: { id }, data });
  return NextResponse.json({ id: updated.id });
}

/**
 * DELETE /api/blocks/:id — remove a structural block. Blocks are scaffolding,
 * not the user's snippets, so removing one is a normal editing action.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  await prisma.block.deleteMany({ where: { id, project: { userId } } });
  return NextResponse.json({ ok: true });
}
