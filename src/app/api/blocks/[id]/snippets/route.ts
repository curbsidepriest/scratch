import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// A block holds MANY snippets (shared references, never moved/copied). These
// endpoints add/remove a snippet within a block; the underlying Snippet is
// untouched either way (§9.2).

/** POST /api/blocks/:id/snippets { snippetId } — append a snippet to the block. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: blockId } = await params;
  const block = await prisma.block.findUnique({ where: { id: blockId } });
  if (!block) return NextResponse.json({ error: "not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const snippetId = (body as { snippetId?: unknown }).snippetId;
  if (typeof snippetId !== "string" || snippetId === "") {
    return NextResponse.json({ error: "snippetId is required" }, { status: 400 });
  }

  // Idempotent: dragging the same snippet in twice is a no-op.
  const existing = await prisma.blockSnippet.findUnique({
    where: { blockId_snippetId: { blockId, snippetId } },
  });
  if (existing) return NextResponse.json({ ok: true });

  const last = await prisma.blockSnippet.findFirst({
    where: { blockId },
    orderBy: { order: "desc" },
  });
  await prisma.blockSnippet.create({
    data: { blockId, snippetId, order: (last?.order ?? -1) + 1 },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}

/** DELETE /api/blocks/:id/snippets { snippetId } — remove a snippet from the
 * block (the snippet itself remains in the bank / Scratchpad). */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: blockId } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const snippetId = (body as { snippetId?: unknown }).snippetId;
  if (typeof snippetId !== "string") {
    return NextResponse.json({ error: "snippetId is required" }, { status: 400 });
  }
  await prisma.blockSnippet.deleteMany({ where: { blockId, snippetId } });
  return NextResponse.json({ ok: true });
}
