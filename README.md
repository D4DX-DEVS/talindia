# Talindia website

Rebuild of https://talindia.co — Next.js 16 (App Router) on Cloudflare Workers via OpenNext, D1 (Drizzle ORM) for
content and form data, R2 for media, and an admin CMS at `/admin`.

## Local development

Requirements: Node 22+, npm. Everything runs locally against Wrangler's D1/R2 emulation (`.wrangler/state`).

```bash
npm install
cp .dev.vars.example .dev.vars           # then fill in ADMIN_EMAIL, ADMIN_PASSWORD_HASH (npm run admin:hash), SESSION_SECRET
npm run db:migrate:local
npm run migrate:wp -- fetch && npm run migrate:wp -- build && npm run migrate:wp -- apply --local
npm run dev                              # http://localhost:4343
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Next dev server on port 4343 with local Cloudflare bindings |
| `npm run preview` | Production build in the Workers runtime (port 4343) |
| `npm run typecheck` / `npm run lint` | TypeScript / ESLint |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright (needs `.env.e2e.local` with `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`) |
| `npm run verify:migration -- --local` | Checks every migrated file and row against `migration/manifest.json` |
| `npm run images:static` | Rebuilds the responsive WebP set in `public/images` |

## Layout

```
src/app/(site)/        public pages (home, about-us, trainings, courses/[slug], all-service/[slug], contact, [slug])
src/app/admin/         login + CMS (dashboard, trainings, services, highlights, testimonials, pages, media, enquiries, subscribers, settings, activity)
src/app/media/         R2 media route (resizing through the Images binding, immutable caching)
src/db/                Drizzle schema + client          drizzle/migrations/  D1 migrations
src/lib/data/          cached public loaders ("use cache" + tags)     src/lib/admin/  admin queries & guards
scripts/               WordPress migration, verification, backups, password hashing
docs/                  PLAN, MIGRATION, DEPLOYMENT, PROGRESS
```

See `docs/DEPLOYMENT.md` before deploying. The live WordPress site must not be replaced until the preview is approved.
