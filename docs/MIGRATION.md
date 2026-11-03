# WordPress → Cloudflare migration

Source: https://talindia.co (WordPress, "Edugen" theme, Elementor). Read via the public REST API
(`/wp-json/wp/v2/*`) and rendered HTML on 2026-10-27. No WordPress admin access or WXR export was available,
so drafts, private posts, form-plugin submissions and plugin settings could not be read (see *Not accessible*).

Tooling (re-runnable, deterministic):

| Step | Command | Output |
| --- | --- | --- |
| Fetch | `npm run migrate:wp -- fetch` | `migration/cache/` (REST JSON, page HTML, every upload) — gitignored |
| Build | `npm run migrate:wp -- build` | `migration/seed.sql`, `migration/manifest.json` (sha256/md5/size per file), `migration/inventory.json` (every WP URL + decision) |
| Apply | `npm run migrate:wp -- apply --local` / `--remote` | D1 migrations + seed, R2 uploads |
| Verify | `npm run verify:migration -- --local` / `-- --url https://<host>` | `migration/verification-<target>.json` |

The extractors (`scripts/lib/wp-extract.ts`) throw if any expected block is missing, so a change on the live site
fails the build instead of silently dropping content. They are unit-tested against frozen fixtures in `tests/fixtures/`.

## Result (local D1 + R2, verified 2026-10-27T13:26Z)

| Item | WordPress | Migrated | Verified |
| --- | --- | --- | --- |
| Media library files | 441 | 441 | 441 sha256 match in R2 + D1 row |
| Site-icon sizes (not in library) | 4 | 4 | 4 |
| **All files** | **445 (21.1 MB)** | **445** | **445 / 445, 0 problems** |
| Courses (Tutor LMS) | 3 posts + 1 home-page card | 4 | rows present |
| Services (CPT) | 1 post + 4 home-page items | 4 | rows present |
| "Why choose" + "We offer" cards | 3 + 6 | 9 | rows present |
| Testimonials | 3 | 3 | rows present |
| Pages with real content | Home, About, Contact | 3 + Trainings listing | rows present |
| Site settings (contact, hero, footer text, webinar, SEO) | — | 8 setting groups | rows present |

File types: 169 PNG, 144 SVG, 129 JPEG, 2 WebP, 1 TXT (a WordPress demo-import log, kept for completeness).
Every upload keeps its path: `/wp-content/uploads/<path>` → 301 → `/media/uploads/<path>`.

Remote (production) verification has **not** been run yet — it happens during deployment
(`npm run verify:migration -- --url https://<preview-host>`).

## URL decisions (41 WordPress URLs, full list in `migration/inventory.json`)

| URL | Decision |
| --- | --- |
| `/`, `/about-us/`, `/contact/` | Same URL |
| `/courses/sap-advanced-excel-for-finance-professionals/`, `/courses/modern-teaching-excellence-for-gcc-educators/` | Same URL |
| `/courses/digital-sales-marketing-masterynew-course/` | 301 → `/courses/digital-sales-marketing-mastery/` (WordPress slug contained a stray "New Course" badge label) |
| `/all-service/individual-skill-development/` | Same URL |
| (new) `/trainings/`, `/courses/data-analytics-for-business-intelligence/` | New: the old "Trainings" menu item linked to `#`, and the 4th course existed only as a home-page card |
| `/home/`, `/home-2/`, `/home-talindia/`, `/sample-page/` | 301 → `/` (duplicate/demo home pages) |
| 10 blog posts, `/blog/`, `/blog-grid/` | 301 → `/` (all Edugen demo posts with lorem ipsum; one is WordPress "Hello world!") |
| `/team/`, `/all-team/*`, `/all-project/*` | 301 → `/` (theme demo lecturers and project) |
| `/courses-grid/`, `/courses-list/`, `/courses/` | 301 → `/trainings/` (demo courses with dollar prices) |
| `/terms-conditions/`, `/privacy-policy-2/` | 301 → `/` (lorem ipsum text mentioning "Edugen", shipping and PayPal — not Talindia's terms) |
| `/shop/`, `/cart*/`, `/checkout*/`, `/my-account/`, `/dashboard/`, `/feed/` | 301 → `/` (WooCommerce/Tutor stubs with no content) |
| `/student-registration/`, `/instructor-registration/`, `/edugen/contact` | 301 → `/contact/` |

## Content corrections made during migration

- **Contact email**: the live contact page *displays* `info@talindia.co` but its mailto link points to the theme
  vendor's demo address `edugenmail@email.com`. The displayed address was migrated.
- Home-page course titles are used (the WordPress post title "Digital Sales & Marketing MasteryNew Course" included a badge label).
- The Digital Sales course post has no target-audience line; the home-page card's audience
  ("Sales professionals adapting to digital-first markets") was used and the post's first bullet kept as a highlight.
- "Modern Teaching Excellence for GCC Educators" uses `digital.png` as its featured image in WordPress (same as
  Digital Sales). Kept as-is; flag for the owner.
- `data.png` (in the library, unattached) is used for "Data Analytics for Business Intelligence".
- Four cut-out portraits uploaded in Aug 2025 but unused by the old layout illustrate the four service sheets.

## Not migrated (and why)

- Theme demo content listed above (no organisation-authored text in it).
- Footer social icons — every icon linked to `#`; no real profiles exist to migrate. Add them in *Admin → Settings → Social*.
- The hero "play" button and "Chat with Us" (linked to `/edugen/contact`, a 404 path) — replaced by links to the contact form with a preset subject.
- 3 WordPress comments (demo comments on demo posts).

## Not accessible (needs WordPress admin access to confirm nothing is lost)

- Contact Form 7 / MetForm / Fluent Forms submissions and MC4WP (Mailchimp) subscriber list.
- Drafts, private or scheduled posts/pages; WooCommerce products (`/wp/v2/product` returned HTTP 524/500).
- Menus API (`/wp/v2/menus`, `menu-items` return 401); menu was read from the rendered HTML instead.
- `sitemap.xml` / `wp-sitemap.xml` on the live site return HTTP 500.

## Unverified content to confirm with the owner

- The three testimonials (Priya Sharma, Rahul Kumar, Anjali Patel) were published on the live site; confirm they
  are real and consented before launch (Admin → Testimonials can unpublish them).
- Hero photo (`prof3.png`) appears to be stock photography uploaded by the site owner.
