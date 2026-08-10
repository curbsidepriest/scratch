import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";

/**
 * POST /api/projects/:id/finish — ship it. A flawed, completed piece beats a
 * flawless concept that never leaves the studio. Marks the piece finished and
 * stamps when; its gems stay "used". Moves to the Finished shelf.
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

  await prisma.project.update({
    where: { id },
    data: { status: "finished", finishedAt: new Date(), dueAt: null },
  });
  return NextResponse.json({ ok: true });
}
