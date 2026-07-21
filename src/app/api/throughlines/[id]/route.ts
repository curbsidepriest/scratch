import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * PATCH /api/throughlines/:id — let the user override the through-line with
 * their own words (spec §5/§8a). Editing marks its origin as "user".
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const existing = await prisma.throughline.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const { phrase } = body as { phrase?: unknown };
  if (typeof phrase !== "string" || phrase.trim() === "") {
    return NextResponse.json({ error: "phrase is required" }, { status: 400 });
  }

  const updated = await prisma.throughline.update({
    where: { id },
    data: { phrase: phrase.trim(), origin: "user" },
  });
  return NextResponse.json({ id: updated.id, phrase: updated.phrase });
}
