import { expect, test, type Page } from "@playwright/test";
import { adminCreds, login, uniqueIp, waitForHydration } from "./helpers";

const PROTECTED = [
  "/admin/",
  "/admin/courses/",
  "/admin/courses/new/",
  "/admin/services/",
  "/admin/highlights/",
  "/admin/testimonials/",
  "/admin/pages/",
  "/admin/media/",
  "/admin/enquiries/",
  "/admin/subscribers/",
  "/admin/settings/",
  "/admin/activity/",
];

test.describe("admin authorization", () => {
  for (const path of PROTECTED) {
    test(`${path} requires a session and leaks no data`, async ({ page, request }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login\/$/);
      const html = await (await request.get(path)).text();
      // Only rendered for a signed-in admin. (The public footer, contact email included, is in every
      // page's payload via the root not-found boundary, so it is not a sign of a leak.)
      for (const marker of ["Published trainings", "Sign out", "SAP &amp; Advanced Excel", adminCreds().email]) {
        expect(html).not.toContain(marker);
      }
    });
  }

  test("enquiry export refuses anonymous requests", async ({ request }) => {
    const res = await request.get("/admin/enquiries/export/");
    expect(res.status()).toBe(401);
  });

  test("a forged session cookie is rejected", async ({ browser }) => {
    const ctx = await browser.newContext();
    await ctx.addCookies([{ name: "talindia_admin", value: "a".repeat(64), url: "http://localhost:4343" }]);
    const page = await ctx.newPage();
    await page.goto("/admin/");
    await expect(page).toHaveURL(/\/admin\/login\/$/);
    await ctx.close();
  });
});

test.describe("admin login", () => {
  test("wrong password is refused with a generic message", async ({ browser }) => {
    const ctx = await browser.newContext({ extraHTTPHeaders: { "cf-connecting-ip": uniqueIp() } });
    const page = await ctx.newPage();
    await page.goto("/admin/login/");
    await page.getByLabel("Email").fill(adminCreds().email);
    await page.getByLabel("Password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
    await ctx.close();
  });

  test("locks out after repeated failures from one IP", async ({ browser }) => {
    const ctx = await browser.newContext({ extraHTTPHeaders: { "cf-connecting-ip": uniqueIp() } });
    const page = await ctx.newPage();
    await page.goto("/admin/login/");
    for (let i = 0; i < 6; i++) {
      await page.getByLabel("Email").fill(`nobody${i}@example.com`);
      await page.getByLabel("Password").fill("wrong");
      await page.getByRole("button", { name: "Sign in" }).click();
      // The form resets once the action settles; filling before that would be wiped.
      await expect(page.getByLabel("Email")).toHaveValue("");
      await expect(page.getByRole("alert").filter({ hasText: /Incorrect|Too many/ })).toBeVisible();
    }
    await expect(page.getByText(/Too many attempts/)).toBeVisible();
    await ctx.close();
  });

  test("signs in, shows real metrics and signs out", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Published trainings")).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).first().click();
    await expect(page).toHaveURL(/\/admin\/login\/$/);
    await page.goto("/admin/");
    await expect(page).toHaveURL(/\/admin\/login\/$/);
  });
});

test.describe("training CRUD", () => {
  test("create draft -> publish -> visible publicly -> delete", async ({ page }) => {
    const title = `E2E Training ${Date.now()}`;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await login(page);
    await page.goto("/admin/courses/new/");
    await page.getByLabel("Title *", { exact: true }).fill(title);
    await page.getByLabel("Title *", { exact: true }).blur();
    await expect(page.getByLabel("URL slug")).toHaveValue(slug);
    await page.getByLabel("Who it is for").fill("Automated test audience");
    await page.getByRole("button", { name: "Create training" }).click();
    await expect(page).toHaveURL(/\/admin\/courses\/\d+\/$/);

    // Draft: not public.
    expect((await page.request.get(`/courses/${slug}/`)).status()).not.toBe(500);
    await page.goto(`/courses/${slug}/`);
    await expect(page.getByRole("heading", { name: "Lost route" })).toBeVisible();

    // Publish.
    await page.goBack();
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Published" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Training saved.")).toBeVisible();
    await page.goto(`/courses/${slug}/`);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await page.goto(`/trainings/?search=${encodeURIComponent("E2E Training")}`);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    // Delete with confirmation.
    await page.goto(`/admin/courses/?search=${encodeURIComponent(title)}`);
    await page.getByRole("button", { name: `Delete ${title}` }).click();
    await expect(page.getByRole("alertdialog")).toContainText("cannot be undone");
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText(`Deleted “${title}”.`)).toBeVisible();
    await page.goto(`/courses/${slug}/`);
    await expect(page.getByRole("heading", { name: "Lost route" })).toBeVisible();
  });

  test("rejects an invalid slug with an inline error", async ({ page }) => {
    await login(page);
    await page.goto("/admin/courses/new/");
    await page.getByLabel("Title *", { exact: true }).fill("Bad slug test");
    await page.getByLabel("URL slug").fill("Not A Slug!");
    await page.getByLabel("Who it is for").fill("Anyone");
    await page.getByRole("button", { name: "Create training" }).click();
    await expect(page.getByText("Lowercase letters, numbers and single hyphens only")).toBeVisible();
  });
});

test.describe("home page settings", () => {
  const HERO_IMG = 'section[aria-labelledby="hero-title"] img';
  const ABOUT_IMG = 'section[aria-labelledby="about-title"] img[sizes*="22vw"]';
  type Originals = Map<string, Record<string, string>>;

  /** Fills fields of one settings section and saves it, remembering the first value seen for each field in `originals`. */
  async function editSection(page: Page, key: string, values: Record<string, string>, originals?: Originals): Promise<void> {
    await page.goto("/admin/settings/");
    // Typing before hydration races react-hook-form's ref registration and corrupts the value.
    await waitForHydration(page, `form#${key}`);
    const seen = originals?.get(key) ?? {};
    for (const [name, value] of Object.entries(values)) {
      const input = page.locator(`#${key}-${name}`);
      if (!(name in seen)) seen[name] = await input.inputValue();
      await input.fill(value);
      await expect(input).toHaveValue(value);
    }
    originals?.set(key, seen);
    const form = page.locator(`form#${key}`);
    await form.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(/: saved\.$/)).toBeVisible();
  }

  async function expectInView(page: Page, selector: string, text: string): Promise<void> {
    const el = page.locator(selector).first();
    await el.scrollIntoViewIfNeeded();
    await expect(el).toContainText(text);
    await expect(el).toBeVisible();
  }

  async function restoreAll(page: Page, originals: Originals): Promise<void> {
    for (const [key, values] of originals) await editSection(page, key, values);
  }

  test("only offers fields the site renders", async ({ page }) => {
    await login(page);
    await page.goto("/admin/settings/");
    await expect(page.locator("#hero-title")).toBeVisible();
    for (const id of ["homeAbout-eyebrow", "sections-whyEyebrow", "sections-offeringsEyebrow", "sections-testimonialsEyebrow"]) {
      await expect(page.locator(`#${id}`)).toHaveCount(0);
    }
  });

  test("text edits show on the public pages", async ({ page }) => {
    const stamp = Date.now().toString(36);
    const originals: Originals = new Map();
    await login(page);
    try {
      await editSection(page, "hero", { title: `Learn ${stamp}. Get hired`, ctaLabel: `Talk ${stamp}` }, originals);
      await editSection(page, "homeAbout", { heading: `About ${stamp}`, ctaLabel: `More ${stamp}` }, originals);
      await editSection(page, "sections", {
        coursesHeading: `Courses ${stamp}`,
        testimonialsHeading: `Voices ${stamp}`,
        whyHeading: `Why ${stamp}`,
        offeringsHeading: `Offer ${stamp}`,
      }, originals);
      await editSection(page, "webinar", { title: `Webinar ${stamp}? Join us` }, originals);

      await page.goto("/");
      await expect(page.locator("#hero-title")).toContainText(`Learn ${stamp}.`);
      await expect(page.locator("#hero-title")).toContainText("Get hired");
      await expect(page.getByRole("link", { name: `Talk ${stamp}` })).toBeVisible();
      // Sections below the fold stay hidden until scrolled into view (scroll-triggered motion).
      await expectInView(page, "#about-title", `About ${stamp}`);
      await expectInView(page, `a:has-text("More ${stamp}")`, `More ${stamp}`);
      await expectInView(page, "#trainings-title", `Courses ${stamp}`);
      await expectInView(page, "#testimonials-title", `Voices ${stamp}`);
      await expectInView(page, "#cta-title", `Webinar ${stamp}?`);
      await page.goto("/about-us/");
      await expectInView(page, "#why-title", `Why ${stamp}`);
      await expectInView(page, `h2:has-text("Offer ${stamp}")`, `Offer ${stamp}`);
    } finally {
      await restoreAll(page, originals);
    }
  });

  test("hero portrait and about illustration come from the media library, else the built-in images", async ({ page }) => {
    const originals: Originals = new Map();
    await login(page);
    try {
      await editSection(page, "hero", { imageKey: "uploads/2025/08/b4de5739-image5.png" }, originals);
      await editSection(page, "homeAbout", { imageKey: "uploads/2025/08/prof3.png" }, originals);
      await page.goto("/");
      await expect(page.locator(HERO_IMG)).toHaveAttribute("src", /^\/media\/uploads\/2025\/08\/b4de5739-image5\.png\?/);
      await expect(page.locator(ABOUT_IMG)).toHaveAttribute("src", /^\/media\/uploads\/2025\/08\/prof3\.png\?/);

      await editSection(page, "hero", { imageKey: "" }, originals);
      await editSection(page, "homeAbout", { imageKey: "" }, originals);
      await page.goto("/");
      await expect(page.locator(HERO_IMG)).toHaveAttribute("src", /^\/images\/hero-portrait-\d+\.webp$/);
      await expect(page.locator(ABOUT_IMG)).toHaveAttribute("src", /^\/images\/about-illustration-\d+\.webp$/);
    } finally {
      await restoreAll(page, originals);
    }
  });
});
