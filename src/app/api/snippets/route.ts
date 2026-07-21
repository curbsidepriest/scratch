import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isSourceMode, wordCount, type SourceMode } from "@/lib/domain";

// NOTE: there is intentionally NO DELETE handler. Snippets are never destroyed
// (spec invariant §9.2). "Removing" happens only as a project-level bench flag.

/** GET /api/snippets — all snippets, reverse-chronological (spec §3). */
export async function GET() {
  const snippets = await prisma.snippet.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(snippets);
}

/** POST /api/snippets — capture a new snippet. */
export async function POST(req: NextRequest) {
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
      content,
      sourceMode: mode,
      wordCount: wordCount(content),
    },
  });

  return NextResponse.json(snippet, { status: 201 });
}
