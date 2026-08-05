import { NextResponse } from "next/server";
import { currentUserId, unauthorized } from "@/lib/auth";
import { evaluateSpark } from "@/lib/spark";

/**
 * POST /api/spark/evaluate — run the Ranker and surface a through-line if one
 * is alive. Called automatically after the writer captures/segments material,
 * and manually via the "look for a spark" control. Body: { force?: boolean } —
 * a manual, forced run re-evaluates and skips the quiet period (see spark.ts).
 */
export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  let force = false;
  try {
    const body = (await req.json()) as { force?: unknown };
    force = body?.force === true;
  } catch {
    /* no body — automatic run */
  }
  const spark = await evaluateSpark(userId, { force });
  return NextResponse.json(spark);
}
