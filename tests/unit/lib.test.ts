import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import imageLoader from "@/lib/image-loader";
import { likePattern, paginate, parseListing, pickEnum } from "@/lib/listing";
import { renderMarkdown } from "@/lib/markdown";
import { legacyRedirects } from "@/lib/redirects";
import { settingsSchemas } from "@/lib/settings-schema";
import { enquirySchema, subscribeSchema } from "@/lib/validation/forms";
import { courseSchema, slugify } from "@/lib/validation/admin";
import { splitHeadline } from "@/components/home/hero";

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).toMatch(/^pbkdf2\$sha256\$100000\$/);
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(await verifyPassword("Correct horse battery staple", hash)).toBe(false);
  });

  it("uses a fresh salt each time", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });

  it("rejects malformed or downgraded hashes", async () => {
    expect(await verifyPassword("x", "plaintext")).toBe(false);
    expect(await verifyPassword("x", "pbkdf2$sha256$1$AAAA$AAAA")).toBe(false);
    expect(await verifyPassword("x", "pbkdf2$md5$100000$AAAA$AAAA")).toBe(false);
  });
});

describe("listing params", () => {
  const opts = { sorts: ["title", "created"] as const, defaultSort: "created" as const };

  it("applies defaults for missing or invalid values", () => {
    expect(parseListing({ page: "-3", pageSize: "37", sort: "drop table", order: "sideways" }, opts)).toEqual({
      page: 1,
      pageSize: 20,
      search: "",
      sort: "created",
      order: "desc",
    });
  });

  it("accepts whitelisted values", () => {
    expect(parseListing({ page: "3", pageSize: "50", sort: "title", order: "asc", search: "  sap " }, opts)).toMatchObject({
      page: 3,
      pageSize: 50,
      sort: "title",
      order: "asc",
      search: "sap",
    });
  });

  it("escapes LIKE wildcards", () => {
    expect(likePattern("100%_a\\b")).toBe("%100\\%\\_a\\\\b%");
  });

  it("computes total pages", () => {
    expect(paginate([], 0, 1, 20).totalPages).toBe(1);
    expect(paginate([], 41, 1, 20).totalPages).toBe(3);
  });

  it("only picks allowed enum values", () => {
    expect(pickEnum("open", ["open", "closed"] as const)).toBe("open");
    expect(pickEnum("x", ["open"] as const)).toBeUndefined();
  });
});

describe("markdown", () => {
  it("escapes raw HTML instead of passing it through", () => {
    const html = renderMarkdown('Hello <script>alert(1)</script> <img src=x onerror="alert(1)">');
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
  });

  it("drops javascript: links but keeps safe ones", () => {
    expect(renderMarkdown("[x](javascript:alert(1))")).not.toContain("href");
    expect(renderMarkdown("[x](/contact/)")).toContain('href="/contact/"');
    expect(renderMarkdown("[x](https://example.com)")).toContain('rel="noopener noreferrer"');
  });
});

describe("image loader", () => {
  it("resizes R2 media through the media route", () => {
    expect(imageLoader({ src: "/media/uploads/a.png", width: 640 })).toBe("/media/uploads/a.png?w=640&q=75");
    expect(imageLoader({ src: "/media/uploads/a.svg", width: 640 })).toBe("/media/uploads/a.svg");
  });

  it("maps static images to the nearest generated width", () => {
    expect(imageLoader({ src: "/images/hero-portrait.webp", width: 750 })).toBe("/images/hero-portrait-800.webp");
    expect(imageLoader({ src: "/images/hero-portrait.webp", width: 3840 })).toBe("/images/hero-portrait-1600.webp");
  });
});

describe("redirects", () => {
  it("has no duplicate sources", () => {
    const sources = legacyRedirects.map((r) => r.source);
    expect(new Set(sources).size).toBe(sources.length);
  });

  it("never redirects a URL the new site serves", () => {
    const served = ["/", "/about-us", "/contact", "/trainings", "/admin", "/media"];
    for (const r of legacyRedirects) expect(served).not.toContain(r.source);
    expect(legacyRedirects.some((r) => r.source.startsWith("/courses/:"))).toBe(false);
  });
});

describe("form validation", () => {
  const ok = { name: "Asha", email: "asha@example.com", message: "I would like to know more." };

  it("accepts a valid enquiry and defaults optional fields", () => {
    const r = enquirySchema.parse(ok);
    expect(r.subject).toBe("general");
    expect(r.phone).toBe("");
  });

  it("rejects bad email, short message and a filled honeypot", () => {
    expect(enquirySchema.safeParse({ ...ok, email: "nope" }).success).toBe(false);
    expect(enquirySchema.safeParse({ ...ok, message: "hi" }).success).toBe(false);
    expect(enquirySchema.safeParse({ ...ok, company: "bot" }).success).toBe(false);
    expect(subscribeSchema.safeParse({ email: "a@b.co" }).success).toBe(true);
  });

  it("validates course slugs and slugifies titles", () => {
    expect(slugify("SAP & Advanced Excel — Finance")).toBe("sap-advanced-excel-finance");
    const base = { title: "Course", slug: "Bad Slug", audience: "People", highlights: [], availability: "open", status: "draft", sortOrder: 1 };
    expect(courseSchema.safeParse(base).success).toBe(false);
    expect(courseSchema.safeParse({ ...base, slug: "good-slug" }).success).toBe(true);
  });

  it("rejects unsafe hrefs in settings", () => {
    const hero = { eyebrow: "", title: "T", subtitle: "", imageKey: "", ctaLabel: "Go", secondaryLabel: "", secondaryCaption: "", secondaryHref: "" };
    expect(settingsSchemas.hero.safeParse({ ...hero, ctaHref: "javascript:alert(1)" }).success).toBe(false);
    expect(settingsSchemas.hero.safeParse({ ...hero, ctaHref: "/contact/" }).success).toBe(true);
  });
});

describe("hero headline", () => {
  it("puts the last sentence on the second line", () => {
    expect(splitHeadline("Upskill . Reskill. Get Placed")).toEqual(["Upskill. Reskill.", "Get Placed"]);
    expect(splitHeadline("One line")).toEqual(["One line", null]);
  });
});
