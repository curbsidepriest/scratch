// Delete ALL rows from every table (keeps the schema/DB intact). Destructive —
// clears scratches, snippets, throughlines, projects, blocks, and everything
// derived. Run: npx tsx tools/wipe-db.ts
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // FK-safe order: children before parents.
  const counts: Record<string, number> = {};
  counts.lintFlags = (await prisma.lintFlag.deleteMany({})).count;
  counts.blockSnippets = (await prisma.blockSnippet.deleteMany({})).count;
  counts.projectSnippets = (await prisma.projectSnippet.deleteMany({})).count;
  counts.evidence = (await prisma.evidence.deleteMany({})).count;
  counts.blocks = (await prisma.block.deleteMany({})).count;
  counts.projects = (await prisma.project.deleteMany({})).count;
  counts.throughlines = (await prisma.throughline.deleteMany({})).count;
  counts.snippets = (await prisma.snippet.deleteMany({})).count;
  counts.scratches = (await prisma.scratch.deleteMany({})).count;
  console.log("Wiped:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
