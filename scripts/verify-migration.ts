/**
 * Verifies a migration run against migration/manifest.json.
 *
 *   npx tsx scripts/verify-migration.ts --local                 # D1 + R2 bindings via wrangler's local state
 *   npx tsx scripts/verify-migration.ts --url https://host      # through a running deployment's /media route
 *
 * Writes migration/verification-<target>.json and exits non-zero on any mismatch.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

interface ManifestEntry {
  id: number;
  key: string;
  size: number;
  sha256: string;
  md5: string;
}

interface Problem {
  key: string;
  problem: string;
}

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "migration", "manifest.json"), "utf8")) as ManifestEntry[];
const seed = fs.readFileSync(path.join(ROOT, "migration", "seed.sql"), "utf8");
const expectedRows: Record<string, number> = {};
for (const m of seed.matchAll(/^INSERT INTO (\w+)/gm)) expectedRows[m[1]] = (expectedRows[m[1]] ?? 0) + 1;

async function verifyLocal(): Promise<{ problems: Problem[]; rows: Record<string, number> }> {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy<CloudflareEnv>({ configPath: path.join(ROOT, "wrangler.jsonc") });
  const problems: Problem[] = [];
  const rows: Record<string, number> = {};
  try {
    for (const table of Object.keys(expectedRows)) {
      const r = await proxy.env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{ n: number }>();
      rows[table] = r?.n ?? 0;
      if (rows[table] < expectedRows[table]) problems.push({ key: table, problem: `D1 has ${rows[table]} rows, seed has ${expectedRows[table]}` });
    }
    const dbMedia = await proxy.env.DB.prepare("SELECT key, size, sha256 FROM media").all<{ key: string; size: number; sha256: string }>();
    const byKey = new Map(dbMedia.results.map((m) => [m.key, m]));
    for (const m of manifest) {
      const row = byKey.get(m.key);
      if (!row) problems.push({ key: m.key, problem: "missing D1 media row" });
      else if (row.sha256 !== m.sha256 || row.size !== m.size) problems.push({ key: m.key, problem: "D1 metadata differs from manifest" });
      const obj = await proxy.env.MEDIA.get(m.key);
      if (!obj) {
        problems.push({ key: m.key, problem: "missing R2 object" });
        continue;
      }
      const buf = Buffer.from(await obj.arrayBuffer());
      if (buf.length !== m.size) problems.push({ key: m.key, problem: `R2 size ${buf.length} != ${m.size}` });
      else if (createHash("sha256").update(buf).digest("hex") !== m.sha256) problems.push({ key: m.key, problem: "R2 checksum mismatch" });
    }
  } finally {
    await proxy.dispose();
  }
  return { problems, rows };
}

async function verifyUrl(base: string): Promise<{ problems: Problem[]; rows: Record<string, number> }> {
  const problems: Problem[] = [];
  const queue = [...manifest];
  await Promise.all(Array.from({ length: 6 }, async () => {
    for (let m = queue.shift(); m; m = queue.shift()) {
      try {
        const res = await fetch(`${base.replace(/\/$/, "")}/media/${m.key}`);
        if (!res.ok) {
          problems.push({ key: m.key, problem: `HTTP ${res.status}` });
          continue;
        }
        const buf = Buffer.from(await res.arrayBuffer());
        if (createHash("sha256").update(buf).digest("hex") !== m.sha256) problems.push({ key: m.key, problem: "checksum mismatch" });
      } catch (error) {
        problems.push({ key: m.key, problem: error instanceof Error ? error.message : String(error) });
      }
    }
  }));
  return { problems, rows: {} };
}

async function main(): Promise<void> {
  const urlIndex = process.argv.indexOf("--url");
  const target = urlIndex > 0 ? process.argv[urlIndex + 1] : "local";
  const { problems, rows } = target === "local" ? await verifyLocal() : await verifyUrl(target);
  const report = {
    target,
    checkedAt: new Date().toISOString(),
    mediaInManifest: manifest.length,
    mediaVerified: manifest.length - new Set(problems.filter((p) => p.key.includes("/")).map((p) => p.key)).size,
    expectedRows,
    actualRows: rows,
    problems,
  };
  const name = target === "local" ? "local" : new URL(target).hostname;
  fs.writeFileSync(path.join(ROOT, "migration", `verification-${name}.json`), JSON.stringify(report, null, 1));
  process.stdout.write(`${JSON.stringify({ ...report, problems: problems.slice(0, 20) }, null, 1)}\n`);
  if (problems.length) process.exit(1);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
