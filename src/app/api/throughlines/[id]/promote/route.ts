import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/throughlines/:id/promote — the key moment (spec §6). Creates a
 * Project from the through-line and pulls in the chosen snippets as SHARED
 * references (ProjectSnippet, included = true). Snippets are never moved or
 * copied; the through-line is marked "promoted".
 *
 * Body: { snippetIds: string[] } — the user-curated set.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const throughline = await prisma.throughline.findUnique({ where: { id } });
  if (!throughline) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // A through-line promotes to at most one project — return the existing one.
  const existing = await prisma.project.findUnique({
    where: { throughlineId: id },
  });
  if (existing) {
    return NextResponse.json({ id: existing.id }, { status: 200 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const rawIds = (body as { snippetIds?: unknown }).snippetIds;
  const requested = Array.isArray(rawIds)
    ? rawIds.filter((x): x is string => typeof x === "string")
    : [];

  // Only reference snippets that actually exist.
  const valid = await prisma.snippet.findMany({
    where: { id: { in: requested } },
    select: { id: true },
  });

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: { throughlineId: id },
    });
    if (valid.length > 0) {
      await tx.projectSnippet.createMany({
        data: valid.map((s) => ({
          projectId: created.id,
          snippetId: s.id,
          included: true,
        })),
      });
    }
    await tx.throughline.update({
      where: { id },
      data: { status: "promoted" },
    });
    return created;
  });

  return NextResponse.json({ id: project.id }, { status: 201 });
}
