import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";

/**
 * POST /api/throughlines/:id/save — shelve a spark for later ("Not now").
 * Sets status "saved" so it leaves the Scratchpad but lands in the Sparks
 * library, where the writer can develop it whenever they like. Nothing is
 * destroyed; a saved phrase won't be re-surfaced by the Ranker (see spark.ts).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;

  const existing = await prisma.throughline.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.throughline.update({
    where: { id },
    data: { status: "saved" },
  });

  return NextResponse.json({ ok: true });
}
