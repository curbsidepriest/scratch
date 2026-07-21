import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRankerService } from "@/lib/services/ranker";

// After the user acts on a spark, stay quiet until this many new snippets have
// accumulated — scarcity gives the spark its weight (spec §5).
const NEW_SNIPPETS_BEFORE_NEXT_SPARK = 3;

type ThroughlineWithEvidence = Awaited<
  ReturnType<typeof findActiveSpark>
>;

function findActiveSpark() {
  return prisma.throughline.findFirst({
    where: { status: "surfaced" },
    orderBy: { createdAt: "desc" },
    include: { evidence: { include: { snippet: true } } },
  });
}

function serialize(t: NonNullable<ThroughlineWithEvidence>) {
  return {
    id: t.id,
    phrase: t.phrase,
    origin: t.origin,
    createdAt: t.createdAt,
    evidence: t.evidence.map((e) => ({
      id: e.id,
      observation: e.observation,
      snippet: { id: e.snippet.id, content: e.snippet.content },
    })),
  };
}

/**
 * GET /api/spark — the currently surfaced through-line, or null.
 *
 * If one is already surfaced, return it (stable, no churn). Otherwise run the
 * Ranker over the snippets; it returns null most of the time. When it does
 * surface something, persist it (Throughline + Evidence) and return it.
 */
export async function GET() {
  const active = await findActiveSpark();
  if (active) return NextResponse.json(serialize(active));

  const snippets = await prisma.snippet.findMany({
    orderBy: { createdAt: "asc" },
  });

  // Quiet period after the last dismiss/promote.
  const lastDecision = await prisma.throughline.findFirst({
    where: { status: { in: ["dismissed", "promoted"] } },
    orderBy: { createdAt: "desc" },
  });
  if (lastDecision) {
    const since = snippets.filter(
      (s) => s.createdAt > lastDecision.createdAt,
    ).length;
    if (since < NEW_SNIPPETS_BEFORE_NEXT_SPARK) {
      return NextResponse.json(null);
    }
  }

  const ranker = getRankerService();
  const candidate = await ranker.evaluate(
    snippets.map((s) => ({
      id: s.id,
      content: s.content,
      createdAt: s.createdAt.toISOString(),
      sourceMode: s.sourceMode,
    })),
  );
  if (!candidate) return NextResponse.json(null);

  // Don't re-surface a territory the user already set aside.
  const dismissedSame = await prisma.throughline.findFirst({
    where: { phrase: candidate.phrase, status: "dismissed" },
  });
  if (dismissedSame) return NextResponse.json(null);

  const created = await prisma.throughline.create({
    data: {
      phrase: candidate.phrase,
      origin: "ranker",
      status: "surfaced",
      evidence: {
        create: candidate.evidence.map((e) => ({
          snippetId: e.snippetId,
          observation: e.observation,
        })),
      },
    },
    include: { evidence: { include: { snippet: true } } },
  });

  return NextResponse.json(serialize(created), { status: 201 });
}
