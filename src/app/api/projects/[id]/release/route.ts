import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";
import { releaseProject } from "@/lib/deadlines";

/**
 * POST /api/projects/:id/release — let it go. Dissolves the piece graciously:
 * the through-line returns to the spark pool and its gems are freed back to the
 * library. Nothing is destroyed (spec §9.2) — the piece is just released.
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

  await releaseProject(id);
  return NextResponse.json({ ok: true });
}
