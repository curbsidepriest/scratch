import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";

/** PATCH /api/projects/:id — save the Editor draft (or set a title). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const existing = await prisma.project.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const { draft, title, dueAt } = body as {
    draft?: unknown;
    title?: unknown;
    dueAt?: unknown;
  };
  const data: { draft?: string; title?: string; dueAt?: Date | null } = {};
  if (typeof draft === "string") data.draft = draft;
  if (typeof title === "string") data.title = title;
  // Put on / take off the anvil. null clears the finish-by date; a string sets it.
  if (dueAt === null) data.dueAt = null;
  else if (typeof dueAt === "string") {
    const d = new Date(dueAt);
    if (!Number.isNaN(d.getTime())) data.dueAt = d;
  }

  await prisma.project.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/projects/:id — delete a piece. Its blocks, snippet references and
 * lint flags cascade away; the underlying snippets are shared and kept. The
 * through-line is un-promoted (back to "surfaced") so the idea returns to play.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;

  const project = await prisma.project.findFirst({ where: { id, userId } });
  if (!project) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.project.delete({ where: { id } }),
    prisma.throughline.update({
      where: { id: project.throughlineId },
      data: { status: "surfaced" },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

/** GET /api/projects/:id — the project with its through-line and snippets. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, userId },
    include: {
      throughline: true,
      projectSnippets: {
        include: { snippet: true },
        orderBy: { snippet: { createdAt: "desc" } },
      },
    },
  });
  if (!project) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: project.id,
    title: project.title,
    draft: project.draft,
    createdAt: project.createdAt,
    throughline: {
      id: project.throughline.id,
      phrase: project.throughline.phrase,
    },
    snippets: project.projectSnippets.map((ps) => ({
      id: ps.id,
      included: ps.included,
      relation: ps.relation,
      snippet: {
        id: ps.snippet.id,
        content: ps.snippet.content,
        label: ps.snippet.label,
        createdAt: ps.snippet.createdAt,
        sourceMode: ps.snippet.sourceMode,
        wordCount: ps.snippet.wordCount,
      },
    })),
  });
}
