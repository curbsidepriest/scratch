import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSegmenterService } from "@/lib/services/segmenter";

/** GET /api/scratches/:id/suggestion — (re)compute a suggested split so the
 * user can review/segment a scratch later. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const scratch = await prisma.scratch.findUnique({ where: { id } });
  if (!scratch) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const suggestion = await getSegmenterService().segment(scratch.content);
  return NextResponse.json(suggestion);
}
