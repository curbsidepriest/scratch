import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";
import { serializeSpark } from "@/lib/spark";

/**
 * GET /api/sparks — the writer's shelved sparks (status "saved"), newest first,
 * each with its evidence + snippets. Powers the Sparks library, where a spark
 * can be developed later or discarded.
 */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const saved = await prisma.throughline.findMany({
    where: { userId, status: "saved" },
    orderBy: { createdAt: "desc" },
    include: { evidence: { include: { snippet: true } } },
  });

  return NextResponse.json(saved.map(serializeSpark));
}
