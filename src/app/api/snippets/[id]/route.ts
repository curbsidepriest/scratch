import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { wordCount } from "@/lib/domain";

// NOTE: still no DELETE — snippets are never destroyed (§9.2). But they are NOT
// immutable: the writer can edit their own words anywhere. Because snippets are
// shared, an edit is reflected in every project that references it.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const existing = await prisma.snippet.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const content = (body as { content?: unknown }).content;
  if (typeof content !== "string" || content.trim() === "") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const updated = await prisma.snippet.update({
    where: { id },
    data: { content, wordCount: wordCount(content) },
  });
  return NextResponse.json({
    id: updated.id,
    content: updated.content,
    wordCount: updated.wordCount,
  });
}
