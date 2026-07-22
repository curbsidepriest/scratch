import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRankerService } from "@/lib/services/ranker";

/**
 * GET /api/throughlines/:id/relevant — the stubbed snippet pull-in for
 * promotion (spec §6). Returns every snippet with a `suggested` flag + reason,
 * suggested ones first. The user curates from here; nothing is committed yet.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const throughline = await prisma.throughline.findUnique({
    where: { id },
    include: { evidence: true },
  });
  if (!throughline) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const snippets = await prisma.snippet.findMany({
    where: { archived: false }, // don't offer archived snippets in the picker (§3)
    orderBy: { createdAt: "desc" },
  });

  const anchorIds = [...new Set(throughline.evidence.map((e) => e.snippetId))];
  const ranker = getRankerService();
  const relevance = await ranker.rankRelevance(
    anchorIds,
    snippets.map((s) => ({
      id: s.id,
      content: s.content,
      createdAt: s.createdAt.toISOString(),
      sourceMode: s.sourceMode,
    })),
  );
  const byId = new Map(relevance.map((r) => [r.snippetId, r]));

  const result = snippets.map((s) => {
    const r = byId.get(s.id);
    return {
      id: s.id,
      content: s.content,
      label: s.label,
      createdAt: s.createdAt,
      sourceMode: s.sourceMode,
      wordCount: s.wordCount,
      suggested: r?.suggested ?? false,
      reason: r?.reason ?? "",
    };
  });

  // Suggested first, then reverse-chronological within each group.
  result.sort((a, b) => Number(b.suggested) - Number(a.suggested));

  return NextResponse.json({
    throughline: { id: throughline.id, phrase: throughline.phrase },
    snippets: result,
  });
}
