import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";
import { wordCount } from "@/lib/domain";
import { sweepDeadlines } from "@/lib/deadlines";

/** GET /api/projects — the user's pieces (active + finished), most recently
 * worked first. Runs the deadline sweep first, so opening the app is what
 * enforces "finish or it dissolves". Released pieces are omitted. */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  await sweepDeadlines(userId, Date.now());

  const projects = await prisma.project.findMany({
    where: { userId, status: { in: ["active", "finished"] } },
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
      dueAt: p.dueAt,
      status: p.status,
      finishedAt: p.finishedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  );
}
