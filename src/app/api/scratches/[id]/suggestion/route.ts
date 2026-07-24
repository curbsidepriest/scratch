import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";
import { getSegmenterService } from "@/lib/services/segmenter";

/** GET /api/scratches/:id/suggestion — (re)compute a suggested split so the
 * user can review/segment a scratch later. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const scratch = await prisma.scratch.findFirst({ where: { id, userId } });
  if (!scratch) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const suggestion = await getSegmenterService().segment(scratch.content);
  return NextResponse.json(suggestion);
}
