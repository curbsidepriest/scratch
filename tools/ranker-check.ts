// Deterministic checks for the Ranker stub — shape + rarity. No DB, no server.
// Run: npx tsx tools/ranker-check.ts
import { StubRankerService } from "../src/lib/services/ranker/stub";
import type { RankerSnippet } from "../src/lib/services/ranker/types";

const ranker = new StubRankerService();
let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

function snips(items: [string, string][]): RankerSnippet[] {
  // Ascending timestamps so "return"/"sharpening" have a direction.
  return items.map(([content, mode], i) => ({
    id: `s${i}`,
    content,
    createdAt: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
    sourceMode: mode,
  }));
}

async function main() {
// 1) An alive, charged, recurring thread should surface.
const alive = snips([
  ["Everyone says ship faster, but the work I'm proud of I sat with. Speed and depth keep pulling against each other.", "dump"],
  ["Reread the speed vs depth thing. Fast isn't worse — fast is how you find what's worth depth. The contrast might be false.", "freewrite"],
  ["Third time back to this: it isn't speed vs depth, it's momentum vs avoidance. Depth I choose differs from depth I hide in.", "freewrite"],
  ["Grocery list: oat milk, coffee, lemons.", "quick_capture"],
]);
const c = await ranker.evaluate(alive);
check("alive thread surfaces a candidate", c !== null);
if (c) {
  check("phrase is observational, not a title", c.phrase.toLowerCase().includes("you"), `"${c.phrase}"`);
  check("phrase mentions the recurring terms", /speed|depth/.test(c.phrase), `"${c.phrase}"`);
  check("has 1-3 evidence items", c.evidence.length >= 1 && c.evidence.length <= 3, `${c.evidence.length}`);
  const ids = new Set(alive.map((s) => s.id));
  check("evidence points at real snippet ids", c.evidence.every((e) => ids.has(e.snippetId)));
  check("every observation is non-empty", c.evidence.every((e) => e.observation.trim().length > 0));
  const praise = /profound|brilliant|great|amazing|insightful|excellent/i;
  check("no quality praise in observations", c.evidence.every((e) => !praise.test(e.observation)));
}

// 2) Mundane notes should stay quiet (rarity).
const noise = snips([
  ["Grocery list: oat milk, coffee, the good bread, lemons.", "quick_capture"],
  ["Meeting notes: Q3 roadmap, move onboarding up, ask design about empty states.", "quick_capture"],
  ["Weather turned. Ran by the river. Nothing to report.", "quick_capture"],
  ["Call the dentist, renew the parking permit.", "quick_capture"],
]);
check("mundane notes surface nothing", (await ranker.evaluate(noise)) === null);

// 3) Frequent-but-flat term must NOT surface — proves it's aliveness, not
//    topic-frequency. "garden" recurs in every snippet, but there is no charge.
const flat = snips([
  ["Spent the morning in the garden.", "freewrite"],
  ["The garden needs weeding again.", "freewrite"],
  ["Planted tomatoes in the garden.", "freewrite"],
  ["Garden looks tidy now.", "freewrite"],
]);
check("frequent-but-flat term stays quiet (not topic-frequency)", (await ranker.evaluate(flat)) === null);

// 4) Too little material → quiet.
check("fewer than 3 snippets stays quiet", (await ranker.evaluate(alive.slice(0, 2))) === null);

console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
}

main();
