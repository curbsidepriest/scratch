import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * PATCH /api/blocks/:id — edit a block's label/body, or fill it from a snippet
 * (spec §8b). Setting a snippet marks the block "filled".
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const existing = await prisma.block.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const { label, body: text, snippetId } = body as {
    label?: unknown;
    body?: unknown;
    snippetId?: unknown;
  };

  const data: {
    label?: string;
    body?: string | null;
    snippetId?: string | null;
    kind?: string;
  } = {};
  if (typeof label === "string" && label.trim() !== "") data.label = label.trim();
  if (typeof text === "string") data.body = text;
  if (text === null) data.body = null;
  if (typeof snippetId === "string") {
    data.snippetId = snippetId;
    data.kind = "filled";
  } else if (snippetId === null) {
    data.snippetId = null;
    data.kind = "placeholder";
  }

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
  const { id } = await params;
  await prisma.block.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
