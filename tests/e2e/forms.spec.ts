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
    let blocked = false;
    for (let i = 0; i < 6 && !blocked; i++) {
      await page.getByLabel("Name *").fill(`E2E flood ${i}`);
      await page.getByLabel("Email *").fill("flood@example.com");
      await page.getByLabel("Your message *").fill("Rate limit check message, safe to delete.");
      await page.getByRole("button", { name: "Send message" }).click();
      const toast = page.locator("[data-sonner-toast]").last();
      await expect(toast).toBeVisible();
      blocked = /Too many messages/.test((await toast.textContent()) ?? "");
      await page.waitForTimeout(300);
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
    await page.getByLabel("Get course launch updates").fill(`e2e+${Date.now()}@example.com`);
    await page.getByRole("button", { name: "Subscribe" }).click();
    await expect(page.getByText(/You're subscribed/)).toBeVisible();
    await ctx.close();
  });
});
