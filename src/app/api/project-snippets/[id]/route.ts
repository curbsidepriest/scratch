import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const RELATIONS = ["relates", "unsure", "unrelated"];

/**
 * PATCH /api/project-snippets/:id — Filter actions (spec §8a).
 * `included: false` benches a snippet (moved to bank, NEVER deleted); `relation`
 * overrides its colour. The underlying Snippet is never touched.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const existing = await prisma.projectSnippet.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const { included, relation } = body as {
    included?: unknown;
    relation?: unknown;
  };

  const data: { included?: boolean; relation?: string } = {};
  if (typeof included === "boolean") data.included = included;
  if (typeof relation === "string" && RELATIONS.includes(relation)) {
    data.relation = relation;
  }

  const updated = await prisma.projectSnippet.update({ where: { id }, data });
  return NextResponse.json({
    id: updated.id,
    included: updated.included,
    relation: updated.relation,
  });
}
