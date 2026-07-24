import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";
import { wordCount } from "@/lib/domain";

/**
 * POST /api/scratches/:id/snippets — commit the user-reviewed segmentation.
 * Creates the paragraph snippets (verbatim content + descriptive label) and
 * sets the scratch's own label. Only segments a scratch once; the raw scratch
 * is preserved as the source.
 *
 * Body: { scratchLabel?: string, snippets: { content: string, label?: string }[] }
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const scratch = await prisma.scratch.findFirst({
    where: { id, userId },
    include: { snippets: true },
  });
  if (!scratch) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (scratch.snippets.length > 0) {
    return NextResponse.json(
      { error: "already segmented" },
      { status: 409 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const { scratchLabel, snippets } = body as {
    scratchLabel?: unknown;
    snippets?: unknown;
  };
  const items = Array.isArray(snippets)
    ? snippets
        .map((s) => s as { content?: unknown; label?: unknown })
        .filter((s) => typeof s.content === "string" && s.content.trim() !== "")
    : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "no snippets" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.scratch.update({
      where: { id },
      data: typeof scratchLabel === "string" ? { label: scratchLabel } : {},
    }),
    prisma.snippet.createMany({
      data: items.map((s, i) => ({
        userId,
        content: s.content as string,
        label: typeof s.label === "string" ? s.label : null,
        order: i,
        scratchId: id,
        sourceMode: scratch.sourceMode,
        wordCount: wordCount(s.content as string),
      })),
    }),
  ]);

  return NextResponse.json({ ok: true }, { status: 201 });
}
