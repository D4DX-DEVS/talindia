-- OpenNext D1 tag cache (on-demand revalidation). Managed by @opennextjs/cloudflare, not by Drizzle.
CREATE TABLE IF NOT EXISTS revalidations (tag TEXT NOT NULL, revalidatedAt INTEGER NOT NULL, UNIQUE(tag) ON CONFLICT REPLACE);
