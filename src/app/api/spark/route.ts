import { NextResponse } from "next/server";
import { currentUserId, unauthorized } from "@/lib/auth";
import { findActiveSpark, serializeSpark } from "@/lib/spark";

/**
 * GET /api/spark — the current user's surfaced through-line, or null. Cheap
 * lookup only; evaluation happens via POST /api/spark/evaluate.
 */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const active = await findActiveSpark(userId);
  return NextResponse.json(active ? serializeSpark(active) : null);
}
