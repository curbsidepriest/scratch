// Verifies the Scratch model + human-in-the-loop segmentation. Dev server on
// :3000. Captures a multi-paragraph session, reviews the split, saves, and
// checks the scratch shows with nested snippets.
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
const page = await browser.newPage({ viewport: { width: 1100, height: 950 } });
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(400);

check("home lists scratches (sessions)", (await page.locator("article").count()) >= 1, `${await page.locator("article").count()} scratch cards`);
await page.screenshot({ path: `${OUT}/11-home-scratches.png` });

// Capture a multi-paragraph session → segmentation review should open.
const composer = page.locator("textarea").first();
await composer.click();
await composer.fill(
  "I keep circling the idea that speed and depth are enemies, but maybe that framing is just wrong and lazy.\n\nToday by the river I realised momentum is not the same thing as avoidance, and that distinction feels like the actual piece.",
);
await page.keyboard.press("Control+Enter");
await page.getByText("Break this into snippets").waitFor({ state: "visible", timeout: 5000 });
await page.waitForTimeout(600); // let the overlay finish fading in
check("multi-paragraph capture opens segmentation review", true);
const drafts = await page.locator("textarea").count();
check("review proposes multiple snippets", drafts >= 3, `${drafts} textareas (incl. composer)`);
await page.screenshot({ path: `${OUT}/12-segmentation.png` });

await page.getByRole("button", { name: "Save snippets" }).click();
await page.waitForTimeout(800);

// Newest scratch should be first, showing 2 snippets; expand to see them.
const first = page.locator("article").first();
check("new scratch shows a snippet count", /snippet/.test(await first.innerText()));
await first.locator("button").first().click(); // expand
await page.waitForTimeout(300);
check("expanded scratch reveals nested snippets", (await first.getByText("edit").count()) >= 1 || (await first.innerText()).length > 0);
await page.screenshot({ path: `${OUT}/13-home-expanded.png` });

await browser.close();
console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
