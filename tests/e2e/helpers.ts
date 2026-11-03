import { expect, type Page } from "@playwright/test";

/** A unique client IP per test so per-IP rate limits never leak between tests (Cloudflare sets this header in production; clients cannot spoof it there). */
export function uniqueIp(): string {
  const n = Math.floor(Math.random() * 250) + 1;
  const m = Math.floor(Math.random() * 250) + 1;
  return `198.51.${n}.${m}`;
}

export function adminCreds(): { email: string; password: string } {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD (see .env.e2e.local)");
  return { email, password };
}

export async function login(page: Page): Promise<void> {
  const { email, password } = adminCreds();
  await page.goto("/admin/login/");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/$/);
}

/** Waits until React has hydrated the element (it attaches `__reactProps$…` to every hydrated DOM node). */
export async function waitForHydration(page: Page, selector: string): Promise<void> {
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      return !!el && Object.keys(el).some((k) => k.startsWith("__reactProps$"));
    },
    selector,
  );
}

/** Collects console errors, ignoring dev-only noise. */
export function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    if (/Download the React DevTools|\[Fast Refresh\]|hydrat.*extension/i.test(t)) return;
    errors.push(t);
  });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}
