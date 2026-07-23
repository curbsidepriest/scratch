import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeSpark } from "@/lib/spark";

/**
 * GET /api/spark — the currently surfaced through-line, or null.
 *
 * This is a cheap lookup: it never runs the Ranker (which, with a real model,
 * would mean an API call on every page load). Evaluation happens explicitly via
 * POST /api/spark/evaluate, triggered after the writer actually writes.
 */
export async function GET() {
  const active = await prisma.throughline.findFirst({
    where: { status: "surfaced" },
    orderBy: { createdAt: "desc" },
    include: { evidence: { include: { snippet: true } } },
  });
  return NextResponse.json(active ? serializeSpark(active) : null);
}
