import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";
import { isSourceMode, wordCount, type SourceMode } from "@/lib/domain";

// NOTE: there is intentionally NO DELETE handler. Snippets are never destroyed
// (spec invariant §9.2). "Removing" happens only as a project-level bench flag.

/**
 * GET /api/snippets — the user's snippets, reverse-chronological (spec §3).
 * Each carries `used` (referenced by a project as an included snippet) and
 * `usedIn` (the piece titles), so the gem library can mark used gems and tuck
 * them into an "away" section (reduce overwhelm / encourage usage).
 */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const snippets = await prisma.snippet.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      projectSnippets: {
        where: { included: true },
        select: { project: { select: { id: true, title: true } } },
      },
    },
  });
  return NextResponse.json(
    snippets.map(({ projectSnippets, ...s }) => ({
      ...s,
      used: projectSnippets.length > 0,
      usedIn: projectSnippets
        .map((ps) => ps.project.title)
        .filter((t): t is string => typeof t === "string" && t.length > 0),
    })),
  );
}

/** POST /api/snippets — capture a new snippet. */
export async function POST(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { content, sourceMode } = (body ?? {}) as {
    content?: unknown;
    sourceMode?: unknown;
  };

  if (typeof content !== "string" || content.trim() === "") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const mode: SourceMode = isSourceMode(sourceMode) ? sourceMode : "freewrite";

  const snippet = await prisma.snippet.create({
    data: {
      userId,
      content,
      sourceMode: mode,
      wordCount: wordCount(content),
    },
  });

  return NextResponse.json(snippet, { status: 201 });
}
