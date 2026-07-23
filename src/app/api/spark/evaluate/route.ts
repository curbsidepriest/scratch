import { NextResponse } from "next/server";
import { evaluateSpark } from "@/lib/spark";

/**
 * POST /api/spark/evaluate — run the Ranker and surface a through-line if one
 * is alive. Called after the writer captures/segments new material, so the
 * (potentially real-model) evaluation happens on writing, not on idle loads.
 */
export async function POST() {
  const spark = await evaluateSpark();
  return NextResponse.json(spark);
}
