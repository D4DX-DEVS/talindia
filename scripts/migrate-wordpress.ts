/**
 * WordPress -> Cloudflare (D1 + R2) migration for talindia.co.
 *
 *   npm run migrate:wp -- fetch            # download REST export + every upload into migration/cache
 *   npm run migrate:wp -- build            # write migration/seed.sql + migration/manifest.json + migration/inventory.json
 *   npm run migrate:wp -- apply --local    # load seed into local D1 and upload media into local R2
 *   npm run migrate:wp -- apply --remote   # same against the Cloudflare account wrangler is logged into
 *
 * Verification lives in scripts/verify-migration.ts.
 */
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import {
  blocksOf,
  decodeCfEmail,
  insertSql,
  parseAbout,
  parseCourse,
  parseHome,
  testimonialRoles,
  textOf,
  uploadKey,
  type WpEntity,
  type WpMedia,
} from "./lib/wp-extract";

const ROOT = path.resolve(__dirname, "..");
const CACHE = path.join(ROOT, "migration", "cache");
const WP_DIR = path.join(CACHE, "wp");
const UPLOADS_DIR = path.join(CACHE, "uploads");
const HTML_DIR = path.join(CACHE, "html");
const OUT_DIR = path.join(ROOT, "migration");
const ORIGIN = "https://talindia.co";
const UA = { "User-Agent": "Mozilla/5.0 (talindia-migration)" };

const REST_TYPES = ["pages", "posts", "media", "categories", "tags", "service", "project", "team", "courses", "course-category", "comments"];
const HTML_PAGES = ["", "about-us", "contact", "courses-grid", "team", "blog", "terms-conditions", "privacy-policy-2", "home-talindia"];
// Site-icon sizes WordPress generates on the fly; they are not listed in the media library.
const EXTRA_UPLOADS = ["2025/08/cropped-icon-32x32.png", "2025/08/cropped-icon-180x180.png", "2025/08/cropped-icon-192x192.png", "2025/08/cropped-icon-270x270.png"];

// ---------------------------------------------------------------- fetch

async function fetchJsonPaged(type: string): Promise<unknown[]> {
  const all: unknown[] = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${ORIGIN}/wp-json/wp/v2/${type}?per_page=100&page=${page}`, { headers: UA });
    if (!res.ok) {
      if (page === 1) throw new Error(`REST ${type}: HTTP ${res.status}`);
      break;
    }
    const batch = (await res.json()) as unknown[];
    all.push(...batch);
    if (page >= Number(res.headers.get("x-wp-totalpages") ?? 1)) break;
  }
  return all;
}

async function download(url: string, dst: string, attempts = 3): Promise<void> {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: UA });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.writeFileSync(dst, Buffer.from(await res.arrayBuffer()));
      return;
    } catch (error) {
      if (i >= attempts) throw error;
      await new Promise((r) => setTimeout(r, 1000 * i));
    }
  }
}

async function pool<T>(items: T[], size: number, fn: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  await Promise.all(Array.from({ length: size }, async () => {
    while (queue.length) await fn(queue.shift() as T);
  }));
}

async function fetchAll(): Promise<void> {
  fs.mkdirSync(WP_DIR, { recursive: true });
  fs.mkdirSync(HTML_DIR, { recursive: true });
  for (const type of REST_TYPES) {
    const rows = await fetchJsonPaged(type);
    fs.writeFileSync(path.join(WP_DIR, `${type}.json`), JSON.stringify(rows, null, 1));
    process.stdout.write(`rest ${type}: ${rows.length}\n`);
  }
  for (const slug of HTML_PAGES) {
    await download(`${ORIGIN}/${slug ? `${slug}/` : ""}`, path.join(HTML_DIR, `${slug || "home"}.html`));
  }
  const media = readJson<WpMedia[]>("media");
  const urls = [...media.map((m) => m.source_url), ...EXTRA_UPLOADS.map((u) => `${ORIGIN}/wp-content/uploads/${u}`)];
  const failures: { url: string; error: string }[] = [];
  await pool(urls, 6, async (url) => {
    const dst = path.join(UPLOADS_DIR, uploadKey(url).replace(/^uploads\//, ""));
    if (fs.existsSync(dst)) return;
    try {
      await download(url, dst);
    } catch (error) {
      failures.push({ url, error: error instanceof Error ? error.message : String(error) });
    }
  });
  fs.writeFileSync(path.join(CACHE, "download-failures.json"), JSON.stringify(failures, null, 1));
  process.stdout.write(`uploads: ${urls.length - failures.length}/${urls.length} downloaded, ${failures.length} failed\n`);
  if (failures.length) process.exitCode = 1;
}

// ---------------------------------------------------------------- build

function readJson<T>(type: string): T {
  return JSON.parse(fs.readFileSync(path.join(WP_DIR, `${type}.json`), "utf8")) as T;
}

function readHtml(name: string): string {
  return fs.readFileSync(path.join(HTML_DIR, `${name}.html`), "utf8");
}

interface ManifestEntry {
  id: number;
  key: string;
  file: string;
  mimeType: string;
  size: number;
  sha256: string;
  md5: string;
  width: number | null;
  height: number | null;
  legacyUrl: string;
  legacyWpId: number | null;
}

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".txt": "text/plain",
};

async function buildManifest(media: WpMedia[]): Promise<ManifestEntry[]> {
  const sources = [
    ...media.map((m) => ({ url: m.source_url, wp: m })),
    ...EXTRA_UPLOADS.map((u) => ({ url: `${ORIGIN}/wp-content/uploads/${u}`, wp: null })),
  ];
  const entries: ManifestEntry[] = [];
  let id = 1;
  for (const { url, wp } of sources) {
    const key = uploadKey(url);
    const file = path.join(UPLOADS_DIR, key.replace(/^uploads\//, ""));
    if (!fs.existsSync(file)) throw new Error(`Migration: upload missing from cache: ${url} (run "fetch" first)`);
    const buf = fs.readFileSync(file);
    const ext = path.extname(file).toLowerCase();
    const mimeType = wp?.mime_type || MIME_BY_EXT[ext] || "application/octet-stream";
    let width = wp?.media_details?.width ?? null;
    let height = wp?.media_details?.height ?? null;
    if ((!width || !height) && mimeType.startsWith("image/") && mimeType !== "image/svg+xml") {
      const meta = await sharp(buf).metadata();
      width = meta.width ?? null;
      height = meta.height ?? null;
    }
    entries.push({
      id: id++,
      key,
      file: path.relative(ROOT, file).split(path.sep).join("/"),
      mimeType,
      size: buf.length,
      sha256: createHash("sha256").update(buf).digest("hex"),
      md5: createHash("md5").update(buf).digest("hex"),
      width,
      height,
      legacyUrl: url,
      legacyWpId: wp?.id ?? null,
    });
  }
  return entries;
}

function mediaIdFor(manifest: ManifestEntry[], fileName: string): number {
  const hit = manifest.find((m) => m.key === `uploads/2025/08/${fileName}`);
  if (!hit) throw new Error(`Migration: media ${fileName} not in manifest`);
  return hit.id;
}

interface ContactInfo {
  email: string;
  phone: string;
  address: string;
}

function parseContact(contactHtml: string): ContactInfo {
  // Use the address shown to visitors (data-cfemail). The live contact page links its "Email-Us"
  // item to the theme demo mailbox (edugenmail@email.com) while displaying info@talindia.co.
  const hex = contactHtml.match(/data-cfemail="([0-9a-f]+)"/)?.[1];
  const phone = textOf(contactHtml).match(/\+91[\d\s]{10,16}\d/)?.[0];
  const address = textOf(contactHtml).match(/1st floor[^.]*?Kerala \d{6}/i)?.[0];
  if (!hex || !phone || !address) throw new Error("Migration: contact details not found on /contact/");
  return { email: decodeCfEmail(hex), phone: phone.replace(/\s+/g, " ").trim(), address: address.replace(/\s+/g, " ").trim() };
}

function htmlTitle(html: string): string {
  return textOf(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
}

const SERVICE_ICONS: Record<string, string> = {
  "Individual Skill Development": "user-round-cog",
  "Job Placement Assistance": "briefcase-business",
  "Corporate Training Solutions": "building-2",
  "Learning & Development Platform": "monitor-play",
};

// Cut-out portraits Talindia uploaded in Aug 2025 (unused by the old theme layout) illustrate the service sheets.
const SERVICE_IMAGES: Record<string, string> = {
  "Individual Skill Development": "abt-prof.png",
  "Job Placement Assistance": "prof.png",
  "Corporate Training Solutions": "prof2-2.png",
  "Learning & Development Platform": "e3f65eed-image.png",
};

const FEATURE_ICONS: Record<string, string> = {
  "Future-Ready Skills": "rocket",
  "Expert Instructors": "graduation-cap",
  "Practical Learning": "hammer",
  "Industry-Aligned Courses": "book-open-check",
  "Interactive Workshops": "presentation",
  "Career Advancement": "trending-up",
  "Mentorship & Support": "handshake",
  "Skill Certification": "badge-check",
  "Global Opportunities": "globe",
};

const slugify = (s: string): string =>
  s.toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function build(): Promise<void> {
  const pagesWp = readJson<WpEntity[]>("pages");
  const coursesWp = readJson<WpEntity[]>("courses");
  const servicesWp = readJson<WpEntity[]>("service");
  const media = readJson<WpMedia[]>("media");
  const homeHtml = readHtml("home");
  const byId = (id: number): WpEntity => {
    const p = pagesWp.find((x) => x.id === id);
    if (!p) throw new Error(`Migration: WP page ${id} missing`);
    return p;
  };

  const frontPage = byId(866); // "Home 3" is the page WordPress serves at "/"
  const home = parseHome(frontPage);
  const about = parseAbout(byId(1160));
  const contact = parseContact(readHtml("contact"));
  const roles = testimonialRoles(homeHtml, home.testimonials.map((t) => t.name));
  const siteTitle = htmlTitle(homeHtml); // "Talindia – Talent Beyond Borders"
  const footerBlurb = textOf(homeHtml.match(/TALINDIA is your complete workforce development partner - [^<]+/)?.[0] ?? "");
  if (!footerBlurb) throw new Error("Migration: footer text not found");
  const eyebrow = textOf(homeHtml).match(/Your One-Stop Career Transformation Hub/)?.[0];
  if (!eyebrow) throw new Error("Migration: hero eyebrow not found");

  const manifest = await buildManifest(media);
  const legacyMediaId = (wpId: number | null): number | null =>
    wpId ? manifest.find((m) => m.legacyWpId === wpId)?.id ?? null : null;

  const sql: string[] = [
    "-- Generated by scripts/migrate-wordpress.ts. Re-running replaces all migrated content (not enquiries, subscribers, sessions or logs).",
    "PRAGMA defer_foreign_keys = true;",
    "DELETE FROM courses; DELETE FROM services; DELETE FROM features; DELETE FROM testimonials; DELETE FROM pages; DELETE FROM settings; DELETE FROM media;",
  ];

  for (const m of manifest) {
    const wp = media.find((x) => x.id === m.legacyWpId);
    sql.push(insertSql("media", {
      id: m.id,
      key: m.key,
      filename: path.basename(m.key),
      mime_type: m.mimeType,
      size: m.size,
      width: m.width,
      height: m.height,
      alt: wp?.alt_text ?? "",
      title: wp ? textOf(wp.title.rendered) : path.basename(m.key),
      sha256: m.sha256,
      legacy_url: m.legacyUrl,
      legacy_wp_id: m.legacyWpId,
      uploaded_by: "wordpress-migration",
    }));
  }

  // Courses: home-page cards define order, display titles and audience; course posts add the detail.
  const courseSlugs: Record<string, { slug: string; legacySlug: string | null; image: string | null }> = {
    "SAP & Advanced Excel for Finance Professionals": { slug: "sap-advanced-excel-for-finance-professionals", legacySlug: null, image: null },
    "Modern Teaching Excellence for GCC Educators": { slug: "modern-teaching-excellence-for-gcc-educators", legacySlug: null, image: null },
    "Digital Sales & Marketing Mastery": { slug: "digital-sales-marketing-mastery", legacySlug: "digital-sales-marketing-masterynew-course", image: null },
    "Data Analytics for Business Intelligence": { slug: "data-analytics-for-business-intelligence", legacySlug: null, image: "data.png" },
  };
  const courseRedirects: { from: string; to: string }[] = [];
  home.homeCourses.forEach((card, index) => {
    const map = courseSlugs[card.title];
    if (!map) throw new Error(`Migration: unmapped course card ${card.title}`);
    const wp = coursesWp.find((c) => c.slug === (map.legacySlug ?? map.slug));
    const detail = wp ? parseCourse(wp) : null;
    const highlights = detail ? [...(detail.audience !== card.audience ? [detail.audience] : []), ...detail.highlights] : [];
    if (map.legacySlug) courseRedirects.push({ from: `/courses/${map.legacySlug}`, to: `/courses/${map.slug}/` });
    sql.push(insertSql("courses", {
      slug: map.slug,
      title: card.title,
      audience: card.audience,
      highlights: JSON.stringify(highlights),
      market_gap: detail?.marketGap ?? null,
      category: "",
      availability: "coming_soon",
      image_id: detail?.imageLegacyId ? legacyMediaId(detail.imageLegacyId) : map.image ? mediaIdFor(manifest, map.image) : null,
      status: "published",
      sort_order: index + 1,
      legacy_wp_id: detail?.legacyWpId ?? null,
      seo_title: null,
      seo_description: `${card.title} — ${card.audience}.`,
    }));
  });
  if (coursesWp.length !== 3) throw new Error(`Migration: expected 3 WP course posts, got ${coursesWp.length}`);

  home.serviceTitles.forEach((title, index) => {
    const wp = servicesWp.find((s) => textOf(s.title.rendered) === title);
    const blocks = wp ? blocksOf(wp.content.rendered) : [];
    const items = blocks.filter((b) => b.tag === "li").map((b) => b.text);
    const heading = blocks.find((b) => b.tag !== "li")?.text ?? "";
    sql.push(insertSql("services", {
      slug: wp?.slug ?? slugify(title),
      title,
      summary: heading,
      highlights: JSON.stringify(items),
      icon: SERVICE_ICONS[title] ?? "sparkles",
      image_id: SERVICE_IMAGES[title] ? mediaIdFor(manifest, SERVICE_IMAGES[title]) : null,
      status: "published",
      sort_order: index + 1,
      legacy_wp_id: wp?.id ?? null,
    }));
  });

  const featureRows = [
    ...home.whyChoose.map((f) => ({ ...f, group: "why_choose" })),
    ...home.offerings.map((f) => ({ ...f, group: "offerings" })),
  ];
  featureRows.forEach((f, index) => {
    sql.push(insertSql("features", {
      group: f.group,
      title: f.title,
      description: f.description,
      icon: FEATURE_ICONS[f.title] ?? "sparkles",
      status: "published",
      sort_order: index + 1,
    }));
  });

  home.testimonials.forEach((t, index) => {
    sql.push(insertSql("testimonials", { quote: t.quote, name: t.name, role: roles[t.name] ?? "", status: "published", sort_order: index + 1 }));
  });

  const aboutImage = mediaIdFor(manifest, "b4de5739-image5.png");
  const pageRows = [
    { slug: "home", title: "Home", intro: home.heroSubtitle, body: "", image_id: mediaIdFor(manifest, "prof3.png"), legacy_wp_id: 866, seo_title: siteTitle, seo_description: home.aboutText },
    { slug: "about-us", title: "About Us", intro: about.paragraphs[0], body: about.paragraphs.slice(1).join("\n\n"), image_id: aboutImage, legacy_wp_id: 1160, seo_title: null, seo_description: about.paragraphs[0] },
    { slug: "trainings", title: "Trainings", intro: "", body: "", image_id: null, legacy_wp_id: null, seo_title: null, seo_description: null },
    { slug: "contact", title: "Contact", intro: "", body: "", image_id: null, legacy_wp_id: 1242, seo_title: null, seo_description: null },
  ];
  for (const p of pageRows) sql.push(insertSql("pages", { ...p, status: "published", system: true }));

  const settingsRows: Record<string, unknown> = {
    site: { name: "Talindia", tagline: "Talent Beyond Borders", title: siteTitle, footerText: footerBlurb, copyrightHolder: "Talindia" },
    contact: { ...contact, phoneHref: `tel:${contact.phone.replace(/\s+/g, "")}`, mapQuery: contact.address },
    // Empty imageKey -> hero and about panel use the pre-optimised copies of prof3.png / image5.png in public/images.
    hero: { eyebrow, title: home.heroTitle, subtitle: home.heroSubtitle, imageKey: "", ctaLabel: "Get in Touch", ctaHref: "/contact/", secondaryLabel: "Chat with Us", secondaryCaption: "Find your mentor here", secondaryHref: "/contact/?subject=mentor" },
    homeAbout: { eyebrow: "About Us", heading: home.aboutHeading, text: home.aboutText, imageKey: "", ctaLabel: "More About Talindia", ctaHref: "/about-us/" },
    webinar: { enabled: true, title: home.webinarTitle, text: home.webinarText, ctaLabel: "Connect With Us", ctaHref: "/contact/?subject=webinar" },
    sections: { coursesHeading: "Courses Coming Soon", whyEyebrow: "Why Choose Us", whyHeading: "Why Choose Talindia", offeringsEyebrow: "What We Offer", offeringsHeading: "We Offer Services", testimonialsEyebrow: "Testimonials", testimonialsHeading: "Success Stories from Our Community" },
    seo: { defaultTitle: siteTitle, titleTemplate: "%s | Talindia", defaultDescription: home.aboutText, ogImageKey: "uploads/2025/08/b4de5739-image5.png" },
    social: [],
  };
  for (const [key, value] of Object.entries(settingsRows)) sql.push(insertSql("settings", { key, value: JSON.stringify(value) }));

  fs.writeFileSync(path.join(OUT_DIR, "seed.sql"), `${sql.join("\n")}\n`);
  fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 1));
  fs.writeFileSync(path.join(OUT_DIR, "course-redirects.json"), JSON.stringify(courseRedirects, null, 1));
  writeInventory();
  process.stdout.write(`seed.sql: ${sql.length} statements; media ${manifest.length}; courses ${home.homeCourses.length}; services ${home.serviceTitles.length}; features ${featureRows.length}; testimonials ${home.testimonials.length}\n`);
}

/** Every URL WordPress exposed, with what happened to it. Written to migration/inventory.json. */
function writeInventory(): void {
  const decisions: Record<string, string> = {
    "/": "migrated -> / (front page \"Home 3\")",
    "/about-us/": "migrated -> /about-us/",
    "/contact/": "migrated -> /contact/ (Contact Form 7 form rebuilt, submissions stored in D1)",
    "/courses/modern-teaching-excellence-for-gcc-educators/": "migrated -> same URL",
    "/courses/sap-advanced-excel-for-finance-professionals/": "migrated -> same URL",
    "/courses/digital-sales-marketing-masterynew-course/": "migrated -> /courses/digital-sales-marketing-mastery/ (301)",
    "/all-service/individual-skill-development/": "migrated -> same URL",
  };
  const rows: { type: string; id: number; url: string; title: string; decision: string }[] = [];
  for (const type of ["pages", "posts", "courses", "service", "project", "team"]) {
    for (const e of readJson<WpEntity[]>(type)) {
      const url = new URL(e.link).pathname;
      rows.push({
        type,
        id: e.id,
        url,
        title: textOf(e.title.rendered),
        decision: decisions[url] ?? "not migrated: theme demo / placeholder / WooCommerce stub -> 301 (see src/lib/redirects.ts)",
      });
    }
  }
  fs.writeFileSync(path.join(OUT_DIR, "inventory.json"), JSON.stringify(rows, null, 1));
}

// ---------------------------------------------------------------- apply

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" });
    let err = "";
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} -> ${code}\n${err}`))));
  });
}

async function apply(target: "local" | "remote"): Promise<void> {
  const flag = `--${target}`;
  await run("npx", ["wrangler", "d1", "migrations", "apply", "talindia-db", flag]);
  await run("npx", ["wrangler", "d1", "execute", "talindia-db", flag, "--file", "migration/seed.sql", "--yes"]);
  process.stdout.write(`D1 (${target}): seed applied\n`);

  const manifest = JSON.parse(fs.readFileSync(path.join(OUT_DIR, "manifest.json"), "utf8")) as ManifestEntry[];
  if (target === "local") {
    const { getPlatformProxy } = await import("wrangler");
    const proxy = await getPlatformProxy<CloudflareEnv>({ configPath: path.join(ROOT, "wrangler.jsonc") });
    try {
      for (const m of manifest) {
        await proxy.env.MEDIA.put(m.key, fs.readFileSync(path.join(ROOT, m.file)), {
          httpMetadata: { contentType: m.mimeType, cacheControl: "public, max-age=31536000, immutable" },
          customMetadata: { sha256: m.sha256, legacyUrl: m.legacyUrl },
        });
      }
    } finally {
      await proxy.dispose();
    }
  } else {
    let done = 0;
    await pool(manifest, 6, async (m) => {
      await run("npx", ["wrangler", "r2", "object", "put", `talindia-media/${m.key}`, "--file", m.file, "--content-type", m.mimeType, "--cache-control", "public, max-age=31536000, immutable", "--remote"]);
      if (++done % 50 === 0) process.stdout.write(`R2 remote: ${done}/${manifest.length}\n`);
    });
  }
  process.stdout.write(`R2 (${target}): ${manifest.length} objects uploaded\n`);
}

// ---------------------------------------------------------------- main

const [command, ...rest] = process.argv.slice(2);
const main: Record<string, () => Promise<void>> = {
  fetch: fetchAll,
  build,
  apply: () => apply(rest.includes("--remote") ? "remote" : "local"),
};
if (!command || !main[command]) {
  process.stderr.write("usage: migrate-wordpress.ts fetch|build|apply [--local|--remote]\n");
  process.exit(1);
}
main[command]().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exit(1);
});
