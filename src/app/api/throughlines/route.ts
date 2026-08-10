import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";
import { getRankerService } from "@/lib/services/ranker";

/**
 * POST /api/throughlines — start a through-line that isn't a spark. Two shapes:
 *
 *   { phrase }          — your OWN through-line, typed from scratch (spec §5).
 *   { seedSnippetId }   — a GEM-SEEDED piece (spec §6): the Ranker derives the
 *                         territory from that one gem and anchors the piece's
 *                         evidence on it, so the promotion pull-in gathers the
 *                         other gems that belong with it.
 *
 * Either way it's created origin "user", status "draft" (so it never shows as a
 * Ranker spark) until it's promoted into a project.
 */
export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const { phrase, seedSnippetId } = (body ?? {}) as {
    phrase?: unknown;
    seedSnippetId?: unknown;
  };

  // Gem-seeded path.
  if (typeof seedSnippetId === "string" && seedSnippetId.trim() !== "") {
    const seed = await prisma.snippet.findFirst({
      where: { id: seedSnippetId, userId, archived: false },
    });
    if (!seed) {
      return NextResponse.json({ error: "seed not found" }, { status: 404 });
    }
    const ranker = getRankerService();
    const candidate = await ranker.seedFrom({
      id: seed.id,
      content: seed.content,
      createdAt: seed.createdAt.toISOString(),
      sourceMode: seed.sourceMode,
    });
    const throughline = await prisma.throughline.create({
      data: {
        userId,
        phrase: candidate.phrase.trim(),
        origin: "user",
        status: "draft",
        evidence: {
          create: candidate.evidence
            .filter((e) => e.snippetId === seed.id)
            .map((e) => ({ snippetId: seed.id, observation: e.observation })),
        },
      },
    });
    return NextResponse.json(
      { id: throughline.id, phrase: throughline.phrase },
      { status: 201 },
    );
  }

  // Own-phrase path.
  if (typeof phrase !== "string" || phrase.trim() === "") {
    return NextResponse.json(
      { error: "phrase or seedSnippetId is required" },
      { status: 400 },
    );
  }
  const throughline = await prisma.throughline.create({
    data: { userId, phrase: phrase.trim(), origin: "user", status: "draft" },
  });
  return NextResponse.json(
    { id: throughline.id, phrase: throughline.phrase },
    { status: 201 },
  );
}
