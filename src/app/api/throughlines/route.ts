import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/throughlines { phrase } — start your OWN through-line, no spark
 * required (spec §5: the user can always define and promote their own). Created
 * as origin "user", status "draft" (so it never shows as a Ranker spark) until
 * it's promoted into a project.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const phrase = (body as { phrase?: unknown }).phrase;
  if (typeof phrase !== "string" || phrase.trim() === "") {
    return NextResponse.json({ error: "phrase is required" }, { status: 400 });
  }

  const throughline = await prisma.throughline.create({
    data: { phrase: phrase.trim(), origin: "user", status: "draft" },
  });
  return NextResponse.json({ id: throughline.id }, { status: 201 });
}
