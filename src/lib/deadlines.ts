import { prisma } from "./db";
import { GRACE_MS } from "./anvil";

/**
 * Dissolve a piece graciously. Nothing is destroyed (spec §9.2): the row stays
 * (status "released"), its gems are freed (projectSnippets un-included, so their
 * "used" mark clears and they're available to seed something else), and the
 * through-line returns to the spark pool ("surfaced"). Idempotent — only acts on
 * an active piece.
 */
export async function releaseProject(projectId: string): Promise<void> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.status !== "active") return;
  await prisma.$transaction([
    prisma.projectSnippet.updateMany({
      where: { projectId },
      data: { included: false },
    }),
    prisma.throughline.update({
      where: { id: project.throughlineId },
      data: { status: "surfaced" },
    }),
    prisma.project.update({
      where: { id: projectId },
      data: { status: "released" },
    }),
  ]);
}

/**
 * Auto-release active pieces whose grace after `dueAt` has elapsed. Run lazily
 * on reads (no cron) — opening the app is what enforces the deadline.
 */
export async function sweepDeadlines(userId: string, now: number): Promise<void> {
  const onAnvil = await prisma.project.findMany({
    where: { userId, status: "active", dueAt: { not: null } },
    select: { id: true, dueAt: true },
  });
  for (const p of onAnvil) {
    if (p.dueAt && now - p.dueAt.getTime() > GRACE_MS) {
      await releaseProject(p.id);
    }
  }
}
