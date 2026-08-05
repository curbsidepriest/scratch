import { prisma } from "@/lib/db";
import { getRankerService } from "@/lib/services/ranker";

// After the user acts on a spark, stay quiet until this many new snippets have
// accumulated — scarcity gives the spark its weight (spec §5).
const NEW_SNIPPETS_BEFORE_NEXT_SPARK = 3;

type ActiveSpark = Awaited<ReturnType<typeof findActiveSpark>>;

export function findActiveSpark(userId: string) {
  return prisma.throughline.findFirst({
    where: { userId, status: "surfaced" },
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
 * through-line, persist + return it.
 *
 * Automatic (opts.force falsy): returns the existing active spark without
 * re-evaluating, and honors the quiet period after a dismiss/promote —
 * scarcity gives the spark its weight (spec §5).
 *
 * Manual (opts.force = true, the user explicitly asked): always re-evaluates
 * and skips the quiet period. It never erases the current spark on a miss — if
 * nothing new surfaces, the existing one (if any) is kept. A genuinely new
 * theme replaces the shown one; the same theme is left as-is. A phrase the user
 * already dismissed is still not re-surfaced.
 */
export async function evaluateSpark(
  userId: string,
  opts: { force?: boolean } = {},
) {
  const active = await findActiveSpark(userId);
  if (active && !opts.force) return serializeSpark(active);

  const snippets = await prisma.snippet.findMany({
    where: { userId, archived: false },
    orderBy: { createdAt: "asc" },
  });

  if (!opts.force) {
    const lastDecision = await prisma.throughline.findFirst({
      where: { userId, status: { in: ["dismissed", "promoted", "saved"] } },
      orderBy: { createdAt: "desc" },
    });
    if (lastDecision) {
      const since = snippets.filter((s) => s.createdAt > lastDecision.createdAt).length;
      if (since < NEW_SNIPPETS_BEFORE_NEXT_SPARK) return null;
    }
  }

  const candidate = await getRankerService().evaluate(
    snippets.map((s) => ({
      id: s.id,
      content: s.content,
      createdAt: s.createdAt.toISOString(),
      sourceMode: s.sourceMode,
    })),
  );
  // A forced run that finds nothing must not wipe an existing spark.
  if (!candidate) return active ? serializeSpark(active) : null;

  // Don't re-surface a phrase the writer already set aside — dismissed for good
  // or shelved in the Sparks library.
  const setAsideSame = await prisma.throughline.findFirst({
    where: {
      userId,
      phrase: candidate.phrase,
      status: { in: ["dismissed", "saved"] },
    },
  });
  if (setAsideSame) return active ? serializeSpark(active) : null;

  // Forced re-run with a spark already showing: keep it if the theme is the
  // same, otherwise replace it with the fresh one (evidence cascades on delete).
  if (active) {
    if (active.phrase === candidate.phrase) return serializeSpark(active);
    await prisma.throughline.delete({ where: { id: active.id } });
  }

  const created = await prisma.throughline.create({
    data: {
      userId,
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
