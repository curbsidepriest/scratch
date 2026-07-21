// Verifies Phase 6 — the three project modes. Promotes a fresh project, then
// exercises Filter, Architect, and Editor. Run `npm run sparks:clear` first and
// have the dev server running on http://localhost:3000.
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
const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });

// Get into a project via promotion.
await page.goto(BASE, { waitUntil: "networkidle" });
await page.locator("aside").first().waitFor({ state: "visible", timeout: 5000 });
await page.getByRole("button", { name: "Develop this →" }).click();
await page.getByText("Becoming a piece").waitFor({ state: "visible", timeout: 5000 });
await page.getByRole("button", { name: "Develop this", exact: true }).click();
await page.waitForURL(/\/project\/.+/, { timeout: 8000 });
await page.waitForTimeout(600);

// --- Filter ---
check("filter shows relation colours", (await page.getByText(/relates|unsure|doesn't/).count()) >= 1);
const benchedBefore = await page.getByText(/Benched ·/).count();
await page.getByRole("button", { name: "Move to bank" }).first().click();
await page.waitForTimeout(500);
check("move to bank benches a snippet (not deleted)", (await page.getByText(/Benched ·/).count()) > benchedBefore);
await page.screenshot({ path: `${OUT}/08-filter.png` });

// --- Architect ---
await page.getByRole("button", { name: /Architect/ }).click();
await page.waitForTimeout(300);
check("architect bank is draggable", (await page.getByText(/drag onto a block/).count()) === 1);
await page.getByPlaceholder(/intro with the anecdote/).fill("Argument: why depth matters");
await page.getByRole("button", { name: "Add block" }).click();
await page.waitForTimeout(500);
check("block is created", (await page.getByText("Argument: why depth matters").count()) >= 1);
check("gap flag is surfaced on the claim", (await page.getByText(/needs support/).count()) >= 1);
await page.locator("select").first().selectOption({ index: 1 });
await page.waitForTimeout(500);
check("block can be filled from a snippet", (await page.getByText("remove fill").count()) >= 1);
await page.screenshot({ path: `${OUT}/09-architect.png` });

// --- Editor ---
await page.getByRole("button", { name: /Editor/ }).click();
await page.waitForTimeout(300);
const draft =
  "The tension between speed and depth has shaped how I work for years now. " +
  "Obviously anyone who cares about craft should slow right down and refuse to ship anything at all quickly.";
await page.locator("textarea").first().fill(draft);
await page.getByRole("button", { name: "Re-check" }).click();
await page.waitForTimeout(800);
check("linter surfaces a flag", (await page.getByText(/does it need support/).count()) >= 1);
await page.screenshot({ path: `${OUT}/10-editor.png` });
// Two-action interaction: acknowledge & dismiss.
await page.getByRole("button", { name: /Acknowledge/ }).first().click();
await page.waitForTimeout(600);
check("acknowledge dismisses the flag", (await page.getByText(/does it need support/).count()) === 0);

await browser.close();
console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
