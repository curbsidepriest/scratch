import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";
import { wordCount } from "@/lib/domain";

/** GET /api/projects — the user's pieces, most recently worked first. */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      throughline: true,
      projectSnippets: { where: { included: true }, select: { id: true } },
    },
  });

  return NextResponse.json(
    projects.map((p) => ({
      id: p.id,
      phrase: p.throughline.phrase,
      title: p.title,
      snippetCount: p.projectSnippets.length,
      draftWords: wordCount(p.draft),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  );
}
