import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";
import { wordCount } from "@/lib/domain";

// NOTE: still no DELETE — snippets are never destroyed (§9.2). But they are NOT
// immutable: the writer can edit their own words anywhere. Because snippets are
// shared, an edit is reflected in every project that references it.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const existing = await prisma.snippet.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const { content, archived } = body as {
    content?: unknown;
    archived?: unknown;
  };

  const data: { content?: string; wordCount?: number; archived?: boolean } = {};
  if (typeof content === "string") {
    if (content.trim() === "") {
      return NextResponse.json({ error: "content cannot be empty" }, { status: 400 });
    }
    data.content = content;
    data.wordCount = wordCount(content);
  }
  // Archiving takes a snippet out of the active consideration set (§3). It is
  // never destroyed and can be unarchived.
  if (typeof archived === "boolean") data.archived = archived;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const updated = await prisma.snippet.update({ where: { id }, data });
  return NextResponse.json({
    id: updated.id,
    content: updated.content,
    wordCount: updated.wordCount,
    archived: updated.archived,
  });
}
