// One-time backfill: give a short glanceable `title` to through-lines created
// before titles existed (their title is null, so the Sparks library falls back
// to the full phrase). Derives each title from the phrase — never invents.
// Idempotent: only touches rows where title IS NULL.
// Run: npx tsx tools/backfill-spark-titles.ts
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { generateTitle } from "../src/lib/services/ranker/title";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const rows = await prisma.throughline.findMany({
    where: { title: null },
    select: { id: true, phrase: true, status: true },
    orderBy: { createdAt: "desc" },
  });
  console.log(`${rows.length} through-line(s) without a title\n`);

  let done = 0;
  for (const r of rows) {
    const title = await generateTitle(r.phrase);
    if (!title) {
      console.log(`- skip ${r.id} (empty title)`);
      continue;
    }
    await prisma.throughline.update({ where: { id: r.id }, data: { title } });
    done++;
    console.log(
      `✓ [${r.status}] "${title}"  ←  ${r.phrase.slice(0, 64)}${r.phrase.length > 64 ? "…" : ""}`,
    );
  }
  console.log(`\nBackfilled ${done}/${rows.length}.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
