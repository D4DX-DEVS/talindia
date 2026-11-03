// node scripts/dev/shots.mjs <path> [outPrefix]  -> .playwright-mcp/<prefix>-{1440,768,390}.jpeg
import { chromium } from "@playwright/test";
const [path = "/", prefix = "shot"] = process.argv.slice(2);
const base = process.env.BASE_URL ?? "http://localhost:4343";
const browser = await chromium.launch();
for (const width of [1440, 768, 390]) {
  const page = await browser.newPage({ viewport: { width, height: width > 800 ? 900 : 844 } });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
  await page.goto(base + path, { waitUntil: "networkidle" });
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 400) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(60); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  // Scroll-driven entrances depend on viewport position; neutralise them for a full-page still.
  await page.addStyleTag({ content: ".reveal,.reveal-2,.reveal-3,.drift{animation:none!important;opacity:1!important;transform:none!important}" });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await page.screenshot({ path: `.playwright-mcp/${prefix}-${width}.jpeg`, fullPage: true, quality: 70, type: "jpeg" });
  console.log(width, "overflowX", overflow, "errors", errors.length, errors.slice(0, 3).join(" | "));
  await page.close();
}
await browser.close();
