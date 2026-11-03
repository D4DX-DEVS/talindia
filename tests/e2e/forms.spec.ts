import { expect, test } from "@playwright/test";
import { login, uniqueIp } from "./helpers";

test.describe("contact form", () => {
  test("shows inline errors for invalid input", async ({ page }) => {
    await page.goto("/contact/");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Please enter your name")).toBeVisible();
    await expect(page.getByText("Please enter a valid email address")).toBeVisible();
    await expect(page.getByText("Please write at least 10 characters")).toBeVisible();
  });

  test("a valid enquiry is stored and visible in the admin", async ({ browser }) => {
    const stamp = `E2E ${Date.now()}`;
    const visitor = await browser.newContext({ extraHTTPHeaders: { "cf-connecting-ip": uniqueIp() } });
    const page = await visitor.newPage();
    await page.goto("/contact/?subject=webinar");
    await expect(page.getByRole("combobox", { name: "What is it about?" })).toHaveText("Free webinar");
    await page.getByLabel("Name *").fill(stamp);
    await page.getByLabel("Email *").fill("e2e@example.com");
    await page.getByLabel("Your message *").fill("Automated end-to-end test message, safe to delete.");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText(/Your message has reached the Talindia team/)).toBeVisible();
    await visitor.close();

    const admin = await browser.newContext();
    const a = await admin.newPage();
    await login(a);
    await a.goto(`/admin/enquiries/?search=${encodeURIComponent(stamp)}`);
    await expect(a.getByText(stamp).first()).toBeVisible();
    await admin.close();
  });

  test("the course form links the enquiry to the training", async ({ browser }) => {
    const visitor = await browser.newContext({ extraHTTPHeaders: { "cf-connecting-ip": uniqueIp() } });
    const page = await visitor.newPage();
    await page.goto("/courses/sap-advanced-excel-for-finance-professionals/#enquire");
    await expect(page.getByText("Enquiring about: SAP & Advanced Excel for Finance Professionals")).toBeVisible();
    await visitor.close();
  });

  test("rate limits a flood of submissions from one IP", async ({ browser }) => {
    const ctx = await browser.newContext({ extraHTTPHeaders: { "cf-connecting-ip": uniqueIp() } });
    const page = await ctx.newPage();
    await page.goto("/contact/");
    const name = page.getByLabel("Name *");
    const tooMany = page.getByText(/Too many messages/);
    let blocked = false;
    for (let i = 0; i < 6 && !blocked; i++) {
      await name.fill(`E2E flood ${i}`);
      await page.getByLabel("Email *").fill("flood@example.com");
      await page.getByLabel("Your message *").fill("Rate limit check message, safe to delete.");
      await page.getByRole("button", { name: "Send message" }).click();
      // Each submission settles as either a reset form (accepted) or the rate-limit toast.
      await expect.poll(async () => (await tooMany.count()) > 0 || (await name.inputValue()) === "").toBe(true);
      blocked = (await tooMany.count()) > 0;
    }
    expect(blocked).toBe(true);
    await ctx.close();
  });
});

test.describe("newsletter", () => {
  test("subscribes from the footer", async ({ browser }) => {
    const ctx = await browser.newContext({ extraHTTPHeaders: { "cf-connecting-ip": uniqueIp() } });
    const page = await ctx.newPage();
    await page.goto("/about-us/");
    const email = page.getByLabel("Get course launch updates");
    // Footer columns stay hidden until scrolled into view (scroll-triggered motion).
    await email.scrollIntoViewIfNeeded();
    await email.fill(`e2e+${Date.now()}@example.com`);
    await page.getByRole("button", { name: "Subscribe" }).click();
    await expect(page.getByText(/You're subscribed/)).toBeVisible();
    await ctx.close();
  });
});
