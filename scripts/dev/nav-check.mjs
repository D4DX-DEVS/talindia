import { chromium } from "@playwright/test";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env.e2e.local", "utf8").trim().split("\n").map((l) => l.split(/=(.*)/s).slice(0, 2)));
const b = await chromium.launch(); const p = await b.newPage();
const log = [];
p.on("console", (m) => log.push(`[${m.type()}] ${m.text().slice(0, 250)}`));
p.on("requestfailed", (r) => log.push(`[reqfail] ${r.url()} ${r.failure()?.errorText}`));
p.on("response", (r) => { if (r.url().includes("/admin/courses/") && r.request().resourceType() === "fetch") log.push(`[rsc] ${r.status()} ${r.url()}`); });
await p.goto("http://localhost:4343/admin/login/");
await p.fill("#email", env.E2E_ADMIN_EMAIL); await p.fill("#password", env.E2E_ADMIN_PASSWORD); await p.click("button[type=submit]");
await p.waitForURL("http://localhost:4343/admin/");
await p.goto("http://localhost:4343/admin/courses/", { waitUntil: "networkidle" });
const t0 = Date.now();
await p.getByRole("link", { name: /SAP & Advanced Excel/ }).first().click();
try { await p.waitForURL(/\/admin\/courses\/\d+\/$/, { timeout: 20000 }); await p.getByLabel("Title", { exact: true }).waitFor({ timeout: 20000 }); console.log("NAV OK in", Date.now() - t0, "ms"); }
catch { console.log("NAV STALLED; url=", p.url()); }
console.log(log.join("\n")); await b.close();
