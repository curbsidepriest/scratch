// Dev helper: clear derived state — projects (and their project-snippet refs,
// blocks, lint flags via cascade) and through-lines (and their evidence). So
// the spark/promotion flow can be demoed/verified from a clean state. Does NOT
// touch snippets — only derived data — so this respects §9.2.
// Run: npx tsx tools/clear-sparks.ts
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Projects first — a promoted through-line is FK-referenced by its project.
  const projects = await prisma.project.deleteMany({});
  const throughlines = await prisma.throughline.deleteMany({});
  console.log(
    `Cleared ${projects.count} project(s) and ${throughlines.count} through-line(s).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
