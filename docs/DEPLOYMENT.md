# Deployment runbook (Cloudflare Workers + D1 + R2)

The live WordPress site stays untouched until the new build is tested on a preview URL **and approved**.
Every step below is run from the repo root with `npx wrangler login` done against the Talindia Cloudflare account.

## 1. Create resources (once)

```bash
npx wrangler d1 create talindia-db                 # copy the database_id
npx wrangler r2 bucket create talindia-media       # uploads (public via /media route only)
npx wrangler r2 bucket create talindia-next-cache  # Next.js ISR / "use cache" store
```

Put the `database_id` into **both** `d1_databases` entries in `wrangler.jsonc` (`DB` and `NEXT_TAG_CACHE_D1`
share one database), then regenerate types: `npm run cf-typegen`.

Enable **Images** on the account (Dashboard → Images) so the `IMAGES` binding can resize media. Without it the
media route falls back to serving originals.

## 2. Secrets (never committed)

```bash
npm run admin:hash                         # prompts for the password, prints the PBKDF2 hash
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put ADMIN_PASSWORD_HASH  # paste the hash
openssl rand -hex 32 | npx wrangler secret put SESSION_SECRET
```

`SITE_URL` is a plain var in `wrangler.jsonc` (`https://talindia.co`). For a preview on `*.workers.dev`, deploy with
`--var SITE_URL:https://talindia.<subdomain>.workers.dev` so canonical URLs and the sitemap point at the preview.

## 3. Database + media

```bash
npm run db:migrate:remote                   # schema + OpenNext revalidations table
npm run migrate:wp -- fetch                 # fresh copy of the live site (optional if cache is current)
npm run migrate:wp -- build
npm run migrate:wp -- apply --remote        # seed D1 + upload 445 files to R2 (≈ 5–10 min)
```

## 4. Build and deploy to a preview URL

```bash
npm run typecheck && npm run lint && npm test
npm run deploy                              # opennextjs-cloudflare build + deploy → https://talindia.<subdomain>.workers.dev
npm run verify:migration -- --url https://talindia.<subdomain>.workers.dev
BASE_URL=https://talindia.<subdomain>.workers.dev E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… npm run test:e2e
```

## 5. Approval, then cut-over

1. Owner reviews the preview (content, testimonials, contact details, legal pages — see `docs/PROGRESS.md`).
2. `npm run backup:d1` and keep the WordPress host running (rollback = repoint DNS).
3. Add `talindia.co` (and `www`) as a **Custom Domain** on the Worker (Workers → talindia → Settings → Domains).
   Cloudflare already serves the zone, so this swaps the origin with no DNS propagation wait.
4. Smoke test production: `npm run verify:migration -- --url https://talindia.co` and the e2e suite with `BASE_URL`.
5. Submit `https://talindia.co/sitemap.xml` in Google Search Console.

## Backups and restore

| What | How | Restore |
| --- | --- | --- |
| D1 point-in-time (30 days, automatic) | `npx wrangler d1 time-travel info talindia-db` | `npx wrangler d1 time-travel restore talindia-db --timestamp <ISO>` |
| D1 SQL dump | `npm run backup:d1` → `backups/d1-<ts>.sql` | `npx wrangler d1 execute talindia-db --remote --file backups/d1-<ts>.sql` (into an empty DB) |
| R2 media | `npm run backup:r2` → `backups/r2-<ts>/` (every key listed in the `media` table) | `wrangler r2 object put` per file, or re-run `migrate:wp apply --remote` for WordPress originals |
| Source | Git | — |

Schedule `backup:d1` weekly (e.g. a CI cron with a scoped API token: D1 Read + R2 Read).

## Operations

- Logs: `npx wrangler tail talindia` (observability is enabled in `wrangler.jsonc`).
- New schema change: edit `src/db/schema.ts` → `npm run db:generate` → review SQL → `npm run db:migrate:local` → test → `npm run db:migrate:remote` → deploy.
- Rotating the admin password: `npm run admin:hash` → `wrangler secret put ADMIN_PASSWORD_HASH`. Changing `ADMIN_EMAIL` ends all sessions.
