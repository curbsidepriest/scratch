import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/throughlines/:id/dismiss — set a through-line aside ("Not now").
 * Nothing is destroyed; the row stays with status "dismissed" so we know not
 * to re-surface the same territory (spec §5/§9).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const existing = await prisma.throughline.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.throughline.update({
    where: { id },
    data: { status: "dismissed" },
  });

  return NextResponse.json({ ok: true });
}
