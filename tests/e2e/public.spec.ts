import { expect, test } from "@playwright/test";
import { trackConsoleErrors } from "./helpers";

const PAGES = [
  { path: "/", h1: /Upskill/i },
  { path: "/about-us/", h1: /About Us/i },
  { path: "/trainings/", h1: /Trainings/i },
  { path: "/contact/", h1: /Get in touch/i },
  { path: "/courses/sap-advanced-excel-for-finance-professionals/", h1: /SAP & Advanced Excel/i },
  { path: "/courses/modern-teaching-excellence-for-gcc-educators/", h1: /Modern Teaching Excellence/i },
  { path: "/courses/digital-sales-marketing-mastery/", h1: /Digital Sales/i },
  { path: "/courses/data-analytics-for-business-intelligence/", h1: /Data Analytics/i },
  { path: "/all-service/individual-skill-development/", h1: /Individual Skill Development/i },
];

test.describe("public pages", () => {
  for (const p of PAGES) {
    test(`${p.path} renders with one h1, canonical and no console errors`, async ({ page }) => {
      const errors = trackConsoleErrors(page);
      const res = await page.goto(p.path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveText(p.h1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${p.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{20,}/);
      await expect(page.getByRole("contentinfo")).toContainText("info@talindia.co");
      expect(errors).toEqual([]);
    });
  }

  test("home shows every migrated section", async ({ page }) => {
    await page.goto("/");
    for (const text of [
      "Empowering Job Seekers with Industry-Ready Skills",
      "Courses Coming Soon",
      "Individual Skill Development",
      "Job Placement Assistance",
      "Corporate Training Solutions",
      "Learning & Development Platform",
      "Success Stories from Our Community",
      "Priya Sharma",
      "Tired of Interview Rejections?",
    ]) {
      await expect(page.getByText(text, { exact: false }).first()).toBeAttached();
    }
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(JSON.parse(ld ?? "{}")).toMatchObject({ "@type": "EducationalOrganization", email: "info@talindia.co" });
  });

  test("home trainings list links to each course", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Modern Teaching Excellence/ }).first().click();
    await expect(page).toHaveURL(/\/courses\//);
    await expect(page.getByText("GCC curriculum standards and teaching methodologies").first()).toBeVisible();
  });

  test("about page carries why-choose and offerings", async ({ page }) => {
    await page.goto("/about-us/");
    for (const text of ["Why Choose Talindia", "Future-Ready Skills", "We Offer Services", "Global Opportunities"]) {
      await expect(page.getByText(text, { exact: false }).first()).toBeAttached();
    }
  });

  test("mobile menu opens and navigates @responsive", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile only");
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "About Us" }).click();
    await expect(page).toHaveURL(/\/about-us\/$/);
  });
});

test.describe("trainings search, filters and pagination", () => {
  test("search is persisted in the URL and survives reload", async ({ page }) => {
    await page.goto("/trainings/");
    const list = page.getByRole("region", { name: "Training list" });
    await expect(list.getByRole("heading", { level: 2 })).toHaveCount(4);
    await page.getByLabel("Search trainings").fill("SAP");
    await expect(page).toHaveURL(/search=SAP/);
    await expect(list.getByRole("heading", { level: 2 })).toHaveCount(1);
    await page.reload();
    await expect(page.getByLabel("Search trainings")).toHaveValue("SAP");
    await expect(page.getByRole("heading", { level: 2, name: /SAP & Advanced Excel/ })).toBeVisible();
  });

  test("no results shows an empty state with a way back", async ({ page }) => {
    await page.goto("/trainings/?search=zzzz-nothing");
    await expect(page.getByText("No trainings match your search")).toBeVisible();
    await page.getByRole("link", { name: "Clear filters" }).click();
    await expect(page).toHaveURL(/\/trainings\/$/);
  });

  test("pageSize and page come from the URL", async ({ page }) => {
    await page.goto("/trainings/?pageSize=10&page=1");
    await expect(page.getByText(/4 results · Page 1 of 1/)).toBeVisible();
    await page.goto("/trainings/?status=closed");
    await expect(page.getByText("No trainings match your search")).toBeVisible();
  });
});

test.describe("SEO and URLs", () => {
  test("robots.txt and sitemap.xml", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(await robots.text()).toMatch(/Disallow: \/admin\//);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    for (const path of ["/about-us/", "/trainings/", "/contact/", "/courses/sap-advanced-excel-for-finance-professionals/", "/all-service/individual-skill-development/"]) {
      expect(sitemap).toContain(path);
    }
    expect(sitemap).not.toContain("/admin");
  });

  const REDIRECTS: [string, string][] = [
    ["/home-talindia/", "/"],
    ["/blog/", "/"],
    ["/team/", "/"],
    ["/hello-world/", "/"],
    ["/courses-grid/", "/trainings/"],
    ["/edugen/contact", "/contact/"],
    ["/courses/digital-sales-marketing-masterynew-course/", "/courses/digital-sales-marketing-mastery/"],
    ["/wp-content/uploads/2025/08/logo.png", "/media/uploads/2025/08/logo.png"],
  ];
  for (const [from, to] of REDIRECTS) {
    test(`redirects ${from} -> ${to}`, async ({ request }) => {
      // Follow at most 3 hops (Next first normalises the trailing slash); every hop must be permanent.
      let path = from;
      for (let hop = 0; hop < 3 && path !== to; hop++) {
        const res = await request.get(path, { maxRedirects: 0 });
        expect([301, 308]).toContain(res.status());
        path = new URL(res.headers().location, "http://x").pathname;
      }
      expect(path).toBe(to);
    });
  }

  test("migrated media is served from R2 with long caching", async ({ request }) => {
    const res = await request.get("/media/uploads/2025/08/logo.png");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
    expect(res.headers()["cache-control"]).toContain("immutable");
  });

  test("unknown pages are noindex and show the not-found page", async ({ page }) => {
    await page.goto("/no-such-page/");
    await expect(page.getByRole("heading", { name: "Lost route" })).toBeVisible();
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
  });

  test("admin is not indexable", async ({ request }) => {
    const res = await request.get("/admin/login/");
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
  });
});

test.describe("responsive layout @responsive", () => {
  for (const width of [375, 768, 1280]) {
    test(`no horizontal scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ["/", "/about-us/", "/trainings/", "/contact/", "/courses/sap-advanced-excel-for-finance-professionals/"]) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${path} at ${width}`).toBeLessThanOrEqual(0);
      }
    });
  }
});
