// Dev helper: clear derived through-lines (and their evidence, via cascade) so
// the spark can be demoed/verified from a clean state. Does NOT touch snippets —
// through-lines are derived, not user writing, so this respects §9.2.
// Run: npx tsx tools/clear-sparks.ts
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const { count } = await prisma.throughline.deleteMany({});
  console.log(`Cleared ${count} through-line(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
