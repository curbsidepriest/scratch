import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isSourceMode, wordCount, type SourceMode } from "@/lib/domain";
import { getSegmenterService } from "@/lib/services/segmenter";

/** GET /api/scratches — every scratch, newest first, with its snippets nested. */
export async function GET() {
  const scratches = await prisma.scratch.findMany({
    orderBy: { createdAt: "desc" },
    include: { snippets: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(
    scratches.map((s) => ({
      id: s.id,
      content: s.content,
      label: s.label,
      sourceMode: s.sourceMode,
      wordCount: s.wordCount,
      createdAt: s.createdAt,
      snippets: s.snippets.map((sn) => ({
        id: sn.id,
        content: sn.content,
        label: sn.label,
        order: sn.order,
        archived: sn.archived,
        createdAt: sn.createdAt,
        sourceMode: sn.sourceMode,
        wordCount: sn.wordCount,
      })),
    })),
  );
}

/**
 * POST /api/scratches — record a raw writing session and return a SUGGESTED
 * paragraph split (not yet persisted as snippets — the user reviews it first).
 */
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

  const scratch = await prisma.scratch.create({
    data: { content, sourceMode: mode, wordCount: wordCount(content) },
  });

  const suggestion = await getSegmenterService().segment(content);

  return NextResponse.json({ id: scratch.id, suggestion }, { status: 201 });
}
