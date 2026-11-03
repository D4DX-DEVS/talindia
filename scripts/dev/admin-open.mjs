// node scripts/dev/admin-open.mjs <path> <shotname> — logs in, opens path, prints console errors, screenshots.
import { chromium } from "@playwright/test";
import fs from "node:fs";
const [path, shot = "admin"] = process.argv.slice(2);
const env = Object.fromEntries(fs.readFileSync(".env.e2e.local", "utf8").trim().split("\n").map((l) => l.split(/=(.*)/s).slice(0, 2)));
const b = await chromium.launch();
for (const width of (process.env.WIDTHS ?? "1280").split(",").map(Number)) {
  const p = await b.newPage({ viewport: { width, height: 900 } });
  const errs = [];
  p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 300)));
  p.on("pageerror", (e) => errs.push("PAGEERROR " + e.message.slice(0, 300)));
  await p.goto("http://localhost:4343/admin/login/");
  await p.fill("#email", env.E2E_ADMIN_EMAIL); await p.fill("#password", env.E2E_ADMIN_PASSWORD); await p.click("button[type=submit]");
  await p.waitForURL("http://localhost:4343/admin/");
  await p.goto("http://localhost:4343" + path, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `.playwright-mcp/${shot}-${width}.jpeg`, type: "jpeg", quality: 70, fullPage: true });
  console.log(width, "errors:", errs.length ? errs.join("\n  ") : "none");
  await p.close();
}
await b.close();
