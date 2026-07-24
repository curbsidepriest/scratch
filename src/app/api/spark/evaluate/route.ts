import { NextResponse } from "next/server";
import { currentUserId, unauthorized } from "@/lib/auth";
import { evaluateSpark } from "@/lib/spark";

/**
 * POST /api/spark/evaluate — run the Ranker and surface a through-line if one
 * is alive. Called after the writer captures/segments new material, so the
 * (potentially real-model) evaluation happens on writing, not on idle loads.
 */
export async function POST() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const spark = await evaluateSpark(userId);
  return NextResponse.json(spark);
}
