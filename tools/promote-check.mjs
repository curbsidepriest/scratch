// Verifies the promotion flow (Phase 5): spark → overlay → project.
// Assumes a fresh spark is available (run `npm run sparks:clear` first) and the
// dev server is running on http://localhost:3000.
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
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });

await page.goto(BASE, { waitUntil: "networkidle" });
await page.locator("aside").first().waitFor({ state: "visible", timeout: 5000 });

// Open the promotion overlay from the spark.
await page.getByRole("button", { name: "Develop this →" }).click();
await page.getByText("Becoming a piece").waitFor({ state: "visible", timeout: 5000 });
await page.waitForTimeout(700); // let the staggered snippets settle
check("promotion overlay opens", await page.getByText("Becoming a piece").count() > 0);
const suggestedCount = await page.getByText(/shares language|the spark pointed here/).count();
check("overlay pulls in relevant snippets", suggestedCount >= 1, `${suggestedCount} suggested`);
await page.screenshot({ path: `${OUT}/06-promotion.png` });

// Create the project (overlay button is exactly "Develop this", no arrow).
await page.getByRole("button", { name: "Develop this", exact: true }).click();
await page.waitForURL(/\/project\/.+/, { timeout: 8000 });
await page.waitForTimeout(700);
check("lands on the project page", /\/project\//.test(page.url()), page.url());
check("project shows the through-line phrase", (await page.getByText(/against depth|speed/i).count()) >= 1);
check("bank sidebar is present", (await page.getByText(/Bank ·/).count()) === 1);
const material = await page.locator("article").count();
check("project shows pulled-in material", material >= 1, `${material} snippet(s)`);
await page.screenshot({ path: `${OUT}/07-project.png` });

await browser.close();
console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
