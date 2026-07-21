// Visual + behavioral verification via Playwright.
// Requires the dev server running on http://localhost:3000.
// Usage: node tools/shots.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "screenshots";
mkdirSync(OUT, { recursive: true });

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const browser = await chromium.launch();

// --- Scratchpad (light) ---
const page = await browser.newPage({ viewport: { width: 1100, height: 850 } });
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/01-scratchpad.png` });
check("scratchpad renders composer", await page.locator("textarea").count() > 0);
check(
  "scratchpad shows seeded snippets",
  (await page.locator("article").count()) >= 7,
  `${await page.locator("article").count()} cards`,
);

// --- Spark (Phase 4) ---
const spark = page.locator("aside");
await spark.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
check("spark surfaces on the seeded thread", (await spark.count()) === 1);
check(
  "spark names territory, not a title",
  (await page.getByText(/setting .* against|circling|coming back to|pulling at/i).count()) >= 1,
);
check(
  "spark shows evidence pointing at the writer's words",
  (await spark.locator("li").count()) >= 1,
  `${await spark.locator("li").count()} evidence item(s)`,
);
if (await spark.count()) {
  await spark.screenshot({ path: `${OUT}/05-spark.png` });
}

// Dismiss ("Not now") should make it disappear.
await page.getByRole("button", { name: "Not now" }).click();
await page.waitForTimeout(700);
check("dismiss removes the spark", (await page.locator("aside").count()) === 0);

// --- Scratchpad (dark) ---
const dark = await browser.newPage({
  viewport: { width: 1100, height: 850 },
  colorScheme: "dark",
});
await dark.goto(BASE, { waitUntil: "networkidle" });
await dark.waitForTimeout(400);
await dark.screenshot({ path: `${OUT}/02-scratchpad-dark.png` });
await dark.close();

// --- Dump setup ---
await page.goto(`${BASE}/dump`, { waitUntil: "networkidle" });
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/03-dump-setup.png` });
check(
  "dump setup shows duration options",
  (await page.getByRole("button", { name: "20 min" }).count()) === 1,
);

// --- Dump running + forward-only assertion ---
await page.getByRole("button", { name: "Begin" }).click();
await page.waitForTimeout(200);
const ta = page.locator("textarea");
await ta.click();
await page.keyboard.type("speed and depth keep pulling at each other");
const before = await ta.inputValue();
// Try to delete — should be a no-op.
await page.keyboard.press("Backspace");
await page.keyboard.press("Backspace");
const after = await ta.inputValue();
check(
  "backspace is disabled (forward-only)",
  before === after && after.endsWith("other"),
  `"${after.slice(-12)}"`,
);
// Try to move to start and insert — should be rejected.
await page.keyboard.press("Home");
await page.keyboard.type("XXX");
const afterInsert = await ta.inputValue();
// Forward-only invariant: the prior text is always still a prefix (nothing was
// inserted into the middle or deleted). Appends at the very end are allowed.
check(
  "mid-string insert is rejected (append-only preserved)",
  afterInsert.startsWith(after) && !afterInsert.includes("XXX"),
  afterInsert.includes("XXX") ? "leaked!" : "clean",
);
await page.screenshot({ path: `${OUT}/04-dump-running.png` });

// countdown present
check(
  "countdown visible",
  /\d:\d\d/.test(await page.locator("body").innerText()),
);

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length === 0 ? 0 : 1);
