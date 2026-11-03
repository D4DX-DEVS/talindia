# Talindia rebuild — implementation plan

## Audit summary (2026-10-27)

talindia.co is a WordPress install of the commercial "Edugen" education theme (Elementor, WooCommerce,
Tutor LMS, Contact Form 7, MC4WP). The REST API (`/wp-json/wp/v2/*`) is public, so the migration reads it
directly; no admin access or WXR export was available.

Real, organisation-authored content is small:

| Area | Source | New location |
| --- | --- | --- |
| Home (hero, about teaser, 4 services, 3 "why choose", 4 courses, 6 offerings, 3 testimonials, webinar banner) | page 866 "Home 3" (front page) | `/` |
| About | page 1160 | `/about-us/` |
| Contact details + contact form (Name, Email, Website, Message) | page 1242 + Contact Form 7 #1265 | `/contact/` |
| 3 course posts + 1 home-only course card | Tutor `courses` | `/trainings/`, `/courses/<slug>/` |
| 1 service post | `service` CPT | `/all-service/<slug>/` |
| Footer newsletter (MC4WP) | footer widget | footer form -> `subscribers` table |
| 441 media library files + 4 site-icon sizes | `/wp-content/uploads` | R2 `uploads/...` |

Everything else (10 lorem-ipsum blog posts, "Team" page with theme demo lecturers, lorem Terms/Privacy pages
mentioning "Edugen", 6 demo course grid items with dollar prices, WooCommerce/Tutor stub pages, duplicate
home pages) is theme demo content. It is **not** published on the new site; every one of those URLs gets a
301 (see `src/lib/redirects.ts`, `migration/inventory.json`). All media files are still migrated to R2 and
listed in the media library, so nothing is lost.

Live-site defects found: course cards link nowhere, "Trainings" menu item is `#`, "Chat with Us" links to
`/edugen/contact`, social icons link to `#`, `sitemap.xml` returns HTTP 500, contact icons hotlink the theme
vendor's demo server.

## Architecture

- Next.js 16.4 App Router, TypeScript, Tailwind 4, shadcn/ui (Radix, Nova preset), lucide-react, motion.
- Cloudflare Workers via `@opennextjs/cloudflare` (runs real Next.js; chosen over vinext because the brief
  specifies Next.js and vinext is a re-implementation with partial parity).
- D1 + Drizzle ORM (`src/db/schema.ts`, migrations in `drizzle/migrations`).
- R2 `MEDIA` bucket for uploads, served by `/media/[...key]` with immutable caching and on-the-fly resizing
  through the Cloudflare Images binding.
- Caching: `cacheComponents` + `"use cache"` loaders tagged per entity; admin mutations call
  `updateTag`/`revalidateTag`. OpenNext R2 incremental cache + D1 tag cache + DO queue.
  Loaders run behind `connection()` so builds never bake local data into production HTML.
- No `proxy.ts`: OpenNext does not support Node-runtime proxy. Admin auth is enforced in the admin layout
  and in every server action / route handler.

## Phases

1. Audit + migration tooling (`scripts/migrate-wordpress.ts`, `scripts/verify-migration.ts`). ✅
2. Design system, layout, public pages, SEO (metadata, canonical, sitemap, robots, JSON-LD), redirects.
3. Forms: contact enquiry + newsletter (zod, honeypot, rate limit, D1).
4. Admin: auth (env credentials, PBKDF2 hash, D1 sessions, login rate limit), dashboard, pages, courses,
   services, highlights, testimonials, enquiries, subscribers, media library, SEO/site settings, activity log.
5. Tests: Vitest units, Playwright e2e + axe, against `opennextjs-cloudflare preview` on port 4343.
6. Deployment runbook (resources, secrets, remote migration, DNS cut-over) — executed only after approval.
