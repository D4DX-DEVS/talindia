import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { login } from "./helpers";

const PUBLIC = ["/", "/about-us/", "/trainings/", "/contact/", "/courses/sap-advanced-excel-for-finance-professionals/", "/all-service/individual-skill-development/"];

async function scan(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).exclude("nextjs-portal").analyze();
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.help} (${v.nodes.length}) ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`);
}

test.describe("accessibility (axe, WCAG 2.1 AA, serious + critical)", () => {
  for (const path of PUBLIC) {
    test(path, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect(await scan(page)).toEqual([]);
    });
  }

  test("admin login", async ({ page }) => {
    await page.goto("/admin/login/");
    expect(await scan(page)).toEqual([]);
  });

  test("admin dashboard and trainings", async ({ page }) => {
    await login(page);
    expect(await scan(page)).toEqual([]);
    await page.goto("/admin/courses/");
    await page.waitForLoadState("networkidle");
    expect(await scan(page)).toEqual([]);
  });
});
