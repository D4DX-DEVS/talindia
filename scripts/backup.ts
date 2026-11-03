/**
 * Backups for production data.
 *   npx tsx scripts/backup.ts d1        -> backups/d1-<timestamp>.sql  (full SQL export of talindia-db)
 *   npx tsx scripts/backup.ts r2        -> backups/r2-<timestamp>/...   (every object in talindia-media)
 * D1 also keeps 30 days of point-in-time history: `npx wrangler d1 time-travel info talindia-db`.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const out = path.join(ROOT, "backups");
fs.mkdirSync(out, { recursive: true });
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

function wrangler(args: string[]): string {
  return execFileSync(npx, ["wrangler", ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, shell: process.platform === "win32" });
}

const target = process.argv[2];
if (target === "d1") {
  const file = path.join(out, `d1-${stamp}.sql`);
  wrangler(["d1", "export", "talindia-db", "--remote", "--output", file]);
  process.stdout.write(`D1 exported to ${file}\n`);
} else if (target === "r2") {
  // List keys from D1 (the media table is the index of every uploaded object), then download each.
  const json = wrangler(["d1", "execute", "talindia-db", "--remote", "--json", "--command", "SELECT key FROM media ORDER BY id"]);
  const keys = (JSON.parse(json) as { results: { key: string }[] }[])[0].results.map((r) => r.key);
  const dir = path.join(out, `r2-${stamp}`);
  for (const key of keys) {
    const file = path.join(dir, key);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    wrangler(["r2", "object", "get", `talindia-media/${key}`, "--file", file, "--remote"]);
  }
  process.stdout.write(`R2: ${keys.length} objects saved to ${dir}\n`);
} else {
  process.stderr.write("usage: backup.ts d1|r2\n");
  process.exit(1);
}
