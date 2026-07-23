import { prisma } from "@/lib/db";
import { getRankerService } from "@/lib/services/ranker";

// After the user acts on a spark, stay quiet until this many new snippets have
// accumulated — scarcity gives the spark its weight (spec §5).
const NEW_SNIPPETS_BEFORE_NEXT_SPARK = 3;

type ActiveSpark = Awaited<ReturnType<typeof findActiveSpark>>;

export function findActiveSpark() {
  return prisma.throughline.findFirst({
    where: { status: "surfaced" },
    orderBy: { createdAt: "desc" },
    include: { evidence: { include: { snippet: true } } },
  });
}

export function serializeSpark(t: NonNullable<ActiveSpark>) {
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
 * Run the Ranker over the active (non-archived) snippets and, if it surfaces a
 * through-line, persist + return it. Returns the existing active spark if one
 * is already surfaced (no re-evaluation). Honors the quiet period after a
 * dismiss/promote and won't re-surface a set-aside phrase.
 */
export async function evaluateSpark() {
  const active = await findActiveSpark();
  if (active) return serializeSpark(active);

  const snippets = await prisma.snippet.findMany({
    where: { archived: false },
    orderBy: { createdAt: "asc" },
  });

  const lastDecision = await prisma.throughline.findFirst({
    where: { status: { in: ["dismissed", "promoted"] } },
    orderBy: { createdAt: "desc" },
  });
  if (lastDecision) {
    const since = snippets.filter((s) => s.createdAt > lastDecision.createdAt).length;
    if (since < NEW_SNIPPETS_BEFORE_NEXT_SPARK) return null;
  }

  const candidate = await getRankerService().evaluate(
    snippets.map((s) => ({
      id: s.id,
      content: s.content,
      createdAt: s.createdAt.toISOString(),
      sourceMode: s.sourceMode,
    })),
  );
  if (!candidate) return null;

  const dismissedSame = await prisma.throughline.findFirst({
    where: { phrase: candidate.phrase, status: "dismissed" },
  });
  if (dismissedSame) return null;

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
  return serializeSpark(created);
}
