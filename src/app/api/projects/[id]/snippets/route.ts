import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { wordCount } from "@/lib/domain";

/**
 * POST /api/projects/:id/snippets — write new copy from inside a project
 * (spec: Architect). Creates a real Snippet (so it also lives in the Scratchpad
 * and can feed other pieces), shares it into this project, and — if a blockId
 * is given — fills that block with it.
 *
 * Body: { content: string, blockId?: string }
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const { content, blockId } = body as { content?: unknown; blockId?: unknown };
  if (typeof content !== "string" || content.trim() === "") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const snippet = await prisma.$transaction(async (tx) => {
    const created = await tx.snippet.create({
      data: {
        content,
        sourceMode: "freewrite",
        wordCount: wordCount(content),
      },
    });
    await tx.projectSnippet.create({
      data: {
        projectId,
        snippetId: created.id,
        included: true,
        relation: "relates",
      },
    });
    if (typeof blockId === "string" && blockId !== "") {
      await tx.block.updateMany({
        where: { id: blockId, projectId },
        data: { snippetId: created.id, kind: "filled" },
      });
    }
    return created;
  });

  return NextResponse.json({ id: snippet.id }, { status: 201 });
}
