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
  const { draft, title } = body as { draft?: unknown; title?: unknown };
  const data: { draft?: string; title?: string } = {};
  if (typeof draft === "string") data.draft = draft;
  if (typeof title === "string") data.title = title;

  await prisma.project.update({ where: { id }, data });
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
