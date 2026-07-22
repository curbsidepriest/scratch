import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const wc = (t: string) => (t.trim() === "" ? 0 : t.trim().split(/\s+/).length);

// Seed scratches (raw sessions), each with its extracted paragraph snippets.
// The "dump" session recurs on speed/depth across its snippets so the Ranker
// has a live thread to surface; the rest are mundane, keeping the spark rare.
const SCRATCHES: {
  label: string;
  sourceMode: string;
  snippets: { content: string; label: string }[];
}[] = [
  {
    label: "speed vs depth, and what's underneath",
    sourceMode: "dump",
    snippets: [
      {
        content:
          "Everyone keeps telling me to ship faster. But the pieces I'm proud of are the ones I sat with for weeks. Speed and depth keep pulling against each other.",
        label: "shipping fast vs sitting with it",
      },
      {
        content:
          "Reread what I wrote about speed vs depth. I don't actually believe fast is worse. Fast is how you find the thing worth going deep on. The contrast might be false.",
        label: "fast is how you find the thing",
      },
      {
        content:
          "Third time coming back to this: the tension isn't speed vs depth, it's momentum vs avoidance. Depth I choose is different from depth I hide in.",
        label: "momentum vs avoidance",
      },
    ],
  },
  {
    label: "craft as fear",
    sourceMode: "freewrite",
    snippets: [
      {
        content:
          "There's a version of craft that's just fear wearing a nice coat. Slowing down because you're scared to be seen, not because the work needs it.",
        label: "craft as fear wearing a coat",
      },
    ],
  },
  {
    label: "groceries + dentist",
    sourceMode: "quick_capture",
    snippets: [
      {
        content:
          "Grocery list: oat milk, coffee, the good bread, lemons. Also call the dentist.",
        label: "groceries, dentist",
      },
    ],
  },
  {
    label: "Q3 roadmap notes",
    sourceMode: "quick_capture",
    snippets: [
      {
        content:
          "Meeting notes: Q3 roadmap, move the onboarding epic up, ask design about the empty states.",
        label: "roadmap, onboarding, empty states",
      },
    ],
  },
  {
    label: "river run",
    sourceMode: "quick_capture",
    snippets: [
      {
        content: "Weather's finally turning. Ran by the river. Nothing to report.",
        label: "weather, river run",
      },
    ],
  },
];

async function main() {
  const existing = await prisma.scratch.count();
  if (existing > 0) {
    console.log(`Scratches already present (${existing}); skipping seed.`);
    return;
  }

  for (const sc of SCRATCHES) {
    const content = sc.snippets.map((s) => s.content).join("\n\n");
    const scratch = await prisma.scratch.create({
      data: {
        content,
        label: sc.label,
        sourceMode: sc.sourceMode,
        wordCount: wc(content),
      },
    });
    await prisma.snippet.createMany({
      data: sc.snippets.map((s, i) => ({
        content: s.content,
        label: s.label,
        order: i,
        scratchId: scratch.id,
        sourceMode: sc.sourceMode,
        wordCount: wc(s.content),
      })),
    });
  }
  console.log(`Seeded ${SCRATCHES.length} scratches.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
