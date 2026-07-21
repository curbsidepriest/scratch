import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

// A handful of fake snippets (spec §10.1). Deliberately shaped with some
// recurrence + a contrast so the Ranker stub (Phase 4) has "aliveness" to find,
// while most are plain notes so the spark stays rare.
const SNIPPETS: { content: string; sourceMode: string }[] = [
  {
    content:
      "Everyone keeps telling me to ship faster. But the pieces I'm proud of are the ones I sat with for weeks. Speed and depth keep pulling against each other.",
    sourceMode: "dump",
  },
  {
    content:
      "Grocery list: oat milk, coffee, the good bread, lemons. Also call the dentist.",
    sourceMode: "quick_capture",
  },
  {
    content:
      "Reread what I wrote about speed vs depth. I don't actually believe fast is worse. Fast is how you find the thing worth going deep on. The contrast might be false.",
    sourceMode: "freewrite",
  },
  {
    content:
      "Meeting notes: Q3 roadmap, move the onboarding epic up, ask design about the empty states.",
    sourceMode: "quick_capture",
  },
  {
    content:
      "There's a version of craft that's just fear wearing a nice coat. Slowing down because you're scared to be seen, not because the work needs it.",
    sourceMode: "dump",
  },
  {
    content:
      "Third time coming back to this: the tension isn't speed vs depth, it's momentum vs avoidance. Depth I choose is different from depth I hide in.",
    sourceMode: "freewrite",
  },
  {
    content: "Weather's finally turning. Ran by the river. Nothing to report.",
    sourceMode: "quick_capture",
  },
];

async function main() {
  // Idempotent-ish: only seed when empty, so re-running doesn't pile up dupes.
  const existing = await prisma.snippet.count();
  if (existing > 0) {
    console.log(`Snippets already present (${existing}); skipping seed.`);
    return;
  }

  for (const s of SNIPPETS) {
    const wordCount = s.content.trim().split(/\s+/).length;
    await prisma.snippet.create({
      data: { content: s.content, sourceMode: s.sourceMode, wordCount },
    });
  }
  console.log(`Seeded ${SNIPPETS.length} snippets.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
