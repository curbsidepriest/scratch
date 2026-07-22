// Verifies the latest tweaks: archive/unarchive (#3), start-your-own-piece
// (#1), and the pieces collection (#2). Dev server on :3000.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "screenshots";
mkdirSync(OUT, { recursive: true });

let failures = 0;
function check(name, ok, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(400);

// --- #3 archive / unarchive ---
const dump = page.locator("article", { hasText: "the speed/depth thing" }).first();
await dump.getByText("the speed/depth thing").click();
await page.waitForTimeout(300);
const activeBefore = await dump.getByRole("button", { name: "archive", exact: true }).count();
const firstSnippet = dump.locator(".group\\/snip").first();
await firstSnippet.hover();
await dump.getByRole("button", { name: "archive", exact: true }).first().click({ force: true });
await page.waitForTimeout(800);
const activeAfter = await dump.getByRole("button", { name: "archive", exact: true }).count();
check("archiving removes a snippet from the active set", activeAfter === activeBefore - 1, `${activeBefore} → ${activeAfter}`);
check("archived snippets are revealable", (await dump.getByText(/show 1 archived/).count()) === 1);
await dump.getByText(/show 1 archived/).click();
await page.waitForTimeout(300);
await dump.getByRole("button", { name: "unarchive" }).first().click();
await page.waitForTimeout(600);
check("unarchive restores it", (await dump.getByRole("button", { name: "archive", exact: true }).count()) === activeBefore);
await page.screenshot({ path: `${OUT}/17-archive.png` });

// --- #1 start your own piece (no spark) ---
await page.getByRole("button", { name: "Start a piece" }).click();
await page.getByPlaceholder(/how you keep mistaking/).fill("what I actually mean by being ready");
await page.getByRole("button", { name: /Pick snippets/ }).click();
await page.getByText("Pick what belongs").waitFor({ state: "visible", timeout: 5000 });
await page.waitForTimeout(400);
check("manual piece opens the snippet picker with all snippets", (await page.getByText("Pick what belongs").count()) === 1);
await page.screenshot({ path: `${OUT}/18-start-piece.png` });
// Pick two snippets, then create.
await page.getByRole("button", { name: /Ran by the river/ }).click();
await page.getByRole("button", { name: /craft that is really just fear/ }).click();
await page.getByRole("button", { name: "Develop this", exact: true }).click();
await page.waitForURL(/\/project\/.+/, { timeout: 8000 });
await page.waitForTimeout(500);
check("manual piece creates a project", /\/project\//.test(page.url()), page.url());
check("piece carries the user's through-line", (await page.getByText("what I actually mean by being ready").count()) >= 1);

// --- #2 pieces collection ---
await page.goto(`${BASE}/pieces`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
check("pieces collection lists the piece", (await page.getByText("what I actually mean by being ready").count()) >= 1);
check("collection shows piece metadata", (await page.getByText(/snippet/).count()) >= 1);
await page.screenshot({ path: `${OUT}/19-pieces.png` });

await browser.close();
console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
