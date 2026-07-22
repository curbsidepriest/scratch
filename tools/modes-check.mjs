// Verifies Phase 6 modes + refinements. Promotes a fresh project, then
// exercises Filter, Architect (default template, write-new-copy, drag-to-fill),
// and Editor. Run `npm run sparks:clear` first; dev server on :3000.
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
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });

// Into a project via promotion.
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
check("move to bank benches (not deletes)", (await page.getByText(/Benched ·/).count()) > benchedBefore);
await page.screenshot({ path: `${OUT}/08-filter.png` });

// --- Architect ---
await page.getByRole("button", { name: /Architect/ }).click();
await page.waitForTimeout(400);
check("default template blocks exist", (await page.getByText("Introduction").count()) >= 1 && (await page.getByText("Body").count()) >= 1 && (await page.getByText("Conclusion").count()) >= 1);
check("no fill dropdown (drag-only)", (await page.locator("select").count()) === 0);

// Add a claim block → gap surfaces.
await page.getByPlaceholder(/intro with the anecdote/).fill("Argument: why depth matters");
await page.getByRole("button", { name: "Add block" }).click();
await page.waitForTimeout(500);
const claim = page.locator("article", { hasText: "Argument: why depth matters" });
check("added block is present", (await claim.count()) >= 1);
check("gap flag surfaced on claim", (await claim.getByText(/needs support/).count()) >= 1);

// Write new copy straight into the block → new snippet fills it + joins bank.
await claim.getByRole("button", { name: "write new copy" }).click();
await claim.locator("textarea").fill("Depth is a choice, not a hiding place. That distinction is the whole piece.");
await claim.getByRole("button", { name: "Save as snippet" }).click();
await page.waitForTimeout(600);
check("write-new-copy fills the block", (await claim.getByText("remove fill").count()) >= 1);
check("new copy became a bank snippet (blob)", (await page.getByText(/Bank · 4/).count()) === 1);

// Drag a bank snippet onto the "Body" block.
const grip = page.getByRole("button", { name: "Drag onto a block" }).first();
const bodyBlock = page.locator("article", { hasText: "Body" }).first();
const g = await grip.boundingBox();
const b = await bodyBlock.boundingBox();
if (g && b) {
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
  await page.mouse.down();
  await page.mouse.move(g.x + 30, g.y + 12, { steps: 6 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2 + 3, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(700);
}
check("drag-to-fill fills the Body block", (await bodyBlock.getByText("remove fill").count()) >= 1);
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
await page.getByRole("button", { name: /Acknowledge/ }).first().click();
await page.waitForTimeout(600);
check("acknowledge dismisses the flag", (await page.getByText(/does it need support/).count()) === 0);

await browser.close();
console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
