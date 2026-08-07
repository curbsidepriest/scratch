// One-off maintenance: run every ACTIVE snippet past an LLM gem-classifier and
// archive the ones that aren't real gems (e.g. "Test"), so the library matches
// the new conservative model (spec §3). Archiving only — never hard-deletes, so
// it honours §9.2 and everything is restorable from the Gems view.
//
// Dry run (default): prints the verdict for every snippet, changes nothing.
//   npx tsx tools/cleanup-gems.ts
// Apply:
//   npx tsx tools/cleanup-gems.ts --apply
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const APPLY = process.argv.includes("--apply");
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";
const BATCH = 40;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const anthropic = new Anthropic();

const SYSTEM = `You are auditing a writer's snippet library. Each snippet was extracted from a
raw writing session and is supposed to be a GEM — a sharp one-liner, a novel
framing, a clean inversion, a real compression, or a genuinely original
observation.

Your job: for each snippet, decide if it EARNS a place in a permanent library of
good atomic ideas. Be conservative but sensible.

Mark isGem=false (should be archived) for:
- test/placeholder/junk content ("Test", "asdf", "hello", "ignore this")
- throat-clearing, warm-up, or plain stream-of-consciousness with no real idea
- ordinary narration, to-do items, or bare restatement
- fragments that only make sense as connective tissue, not on their own

Mark isGem=true (keep) for anything that is genuinely striking, surprising, or
worth returning to on its own. When a snippet is a real thought but merely
ordinary, prefer isGem=false — the library should stay small and high-signal.
Give a terse reason (a few words) either way.`;

interface Verdict {
  id: string;
  isGem: boolean;
  reason: string;
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["verdicts"],
  properties: {
    verdicts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "isGem", "reason"],
        properties: {
          id: { type: "string" },
          isGem: { type: "boolean" },
          reason: { type: "string" },
        },
      },
    },
  },
} as const;

async function classify(
  batch: { id: string; content: string; label: string | null }[],
): Promise<Verdict[]> {
  const user =
    "Audit these snippets. Return a verdict for every id.\n\n" +
    batch
      .map(
        (s) =>
          `id: ${s.id}\nlabel: ${s.label ?? "(none)"}\ncontent: ${JSON.stringify(
            s.content,
          )}`,
      )
      .join("\n\n");

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    messages: [{ role: "user", content: user }],
    // output_config is a current API param that may lead the installed SDK types.
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
  } as unknown as Parameters<Anthropic["messages"]["create"]>[0]);

  const message = res as Anthropic.Message;
  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return (JSON.parse(text) as { verdicts: Verdict[] }).verdicts;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set — cannot classify.");
  }
  const snippets = await prisma.snippet.findMany({
    where: { archived: false },
    select: { id: true, content: true, label: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(
    `${snippets.length} active snippet(s). Model: ${MODEL}. Mode: ${
      APPLY ? "APPLY (will archive)" : "DRY RUN (no changes)"
    }\n`,
  );
  if (snippets.length === 0) return;

  const verdicts = new Map<string, Verdict>();
  for (let i = 0; i < snippets.length; i += BATCH) {
    const batch = snippets.slice(i, i + BATCH);
    const out = await classify(batch);
    for (const v of out) verdicts.set(v.id, v);
  }

  const byId = new Map(snippets.map((s) => [s.id, s]));
  const toArchive: Verdict[] = [];
  const kept: Verdict[] = [];
  for (const s of snippets) {
    const v = verdicts.get(s.id);
    // Missing verdict → keep (fail safe: never archive on uncertainty).
    if (!v || v.isGem) kept.push(v ?? { id: s.id, isGem: true, reason: "no verdict — kept" });
    else toArchive.push(v);
  }

  const preview = (id: string) => {
    const c = byId.get(id)?.content.replace(/\s+/g, " ").trim() ?? "";
    return c.length > 70 ? c.slice(0, 67) + "…" : c;
  };

  console.log(`── ARCHIVE (${toArchive.length}) ──`);
  for (const v of toArchive) console.log(`  ✗ "${preview(v.id)}"  — ${v.reason}`);
  console.log(`\n── KEEP (${kept.length}) ──`);
  for (const v of kept) console.log(`  ✓ "${preview(v.id)}"  — ${v.reason}`);

  if (!APPLY) {
    console.log(`\nDRY RUN — nothing changed. Re-run with --apply to archive the ${toArchive.length} above.`);
    return;
  }
  if (toArchive.length === 0) {
    console.log(`\nNothing to archive.`);
    return;
  }
  const r = await prisma.snippet.updateMany({
    where: { id: { in: toArchive.map((v) => v.id) } },
    data: { archived: true },
  });
  console.log(`\nArchived ${r.count} snippet(s). Restore any from the Gems view.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
