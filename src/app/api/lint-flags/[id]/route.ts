import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";

const STATUSES = ["open", "acknowledged", "resolved"];

/**
 * PATCH /api/lint-flags/:id — the two-action interaction (spec §8c). The only
 * moves are the writer fixing it (which resolves via re-lint) or acknowledging
 * it here. Acknowledged flags won't re-raise unless the text materially changes.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const existing = await prisma.lintFlag.findFirst({
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
  const status = (body as { status?: unknown }).status;
  if (typeof status !== "string" || !STATUSES.includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  await prisma.lintFlag.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true });
}
