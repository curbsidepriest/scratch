import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** GET /api/projects/:id — the project with its through-line and snippets. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
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
    createdAt: project.createdAt,
    throughline: {
      id: project.throughline.id,
      phrase: project.throughline.phrase,
    },
    snippets: project.projectSnippets.map((ps) => ({
      included: ps.included,
      snippet: {
        id: ps.snippet.id,
        content: ps.snippet.content,
        createdAt: ps.snippet.createdAt,
        sourceMode: ps.snippet.sourceMode,
        wordCount: ps.snippet.wordCount,
      },
    })),
  });
}
