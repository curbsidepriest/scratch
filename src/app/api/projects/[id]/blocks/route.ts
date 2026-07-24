import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";
import { getLinterService } from "@/lib/services/linter";

async function ownsProject(userId: string, projectId: string) {
  return !!(await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  }));
}

/** GET /api/projects/:id/blocks — ordered blocks, each annotated with any gap. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  if (!(await ownsProject(userId, id))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const blocks = await prisma.block.findMany({
    where: { projectId: id },
    orderBy: { order: "asc" },
    include: {
      blockSnippets: {
        orderBy: { order: "asc" },
        include: { snippet: true },
      },
    },
  });

  const linter = getLinterService();
  const gaps = await linter.findGaps(
    blocks.map((b) => ({
      id: b.id,
      label: b.label,
      body: b.body,
      filled: b.blockSnippets.length > 0,
    })),
  );
  const gapByBlock = new Map(gaps.map((g) => [g.blockId, g.reason]));

  return NextResponse.json(
    blocks.map((b) => ({
      id: b.id,
      label: b.label,
      body: b.body,
      order: b.order,
      parentBlockId: b.parentBlockId,
      kind: b.kind,
      snippets: b.blockSnippets.map((bs) => ({
        id: bs.snippet.id,
        content: bs.snippet.content,
        label: bs.snippet.label,
      })),
      gap: gapByBlock.get(b.id) ?? null,
    })),
  );
}

/** POST /api/projects/:id/blocks — add a placeholder block at the end. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  if (!(await ownsProject(userId, id))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const label = (body as { label?: unknown }).label;
  if (typeof label !== "string" || label.trim() === "") {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  const last = await prisma.block.findFirst({
    where: { projectId: id },
    orderBy: { order: "desc" },
  });
  const order = (last?.order ?? -1) + 1;

  const block = await prisma.block.create({
    data: { projectId: id, label: label.trim(), order, kind: "placeholder" },
  });
  return NextResponse.json({ id: block.id }, { status: 201 });
}
