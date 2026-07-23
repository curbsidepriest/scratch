// One-off backfill: wrap every pre-existing snippet (created before the Scratch
// model) in its own Scratch, so nothing is orphaned in the new home. Safe to
// re-run — only touches snippets whose scratchId is null.
// Run: npx tsx tools/backfill-scratches.ts
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const orphans = await prisma.snippet.findMany({ where: { scratchId: null } });
  let wrapped = 0;
  for (const s of orphans) {
    const scratch = await prisma.scratch.create({
      data: {
        content: s.content,
        sourceMode: s.sourceMode,
        wordCount: s.wordCount,
        createdAt: s.createdAt, // preserve chronology
      },
    });
    await prisma.snippet.update({
      where: { id: s.id },
      data: { scratchId: scratch.id, order: 0 },
    });
    wrapped++;
  }
  console.log(`Wrapped ${wrapped} orphan snippet(s) in scratches.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
