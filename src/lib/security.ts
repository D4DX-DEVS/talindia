import "server-only";
import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb, getEnv } from "@/db/client";

const encoder = new TextEncoder();

export function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(input: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(input)));
}

export function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return toHex(buf.buffer);
}

/** Constant-time comparison for equal-length hex/ASCII strings. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function requestMeta(): Promise<{ ip: string; userAgent: string; origin: string | null }> {
  const h = await headers();
  const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return { ip, userAgent: (h.get("user-agent") ?? "").slice(0, 300), origin: h.get("origin") };
}

/** IPs are never stored raw: salted hash, so abuse can be correlated without keeping personal data. */
export async function hashIp(ip: string): Promise<string> {
  const env = await getEnv();
  const salt = env.SESSION_SECRET ?? "";
  return (await sha256Hex(`${salt}:${ip}`)).slice(0, 32);
}

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  retryAfterSeconds: number;
}

/** Fixed-window counter stored in D1 (one row per bucket+key). */
export async function rateLimit(bucket: string, key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const db = await getDb();
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);
  const rows = await db.all<{ count: number; window_start: number }>(sql`
    INSERT INTO rate_limits (bucket, key, window_start, count) VALUES (${bucket}, ${key}, ${windowStart}, 1)
    ON CONFLICT (bucket, key) DO UPDATE SET
      count = CASE WHEN rate_limits.window_start < ${windowStart} THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE WHEN rate_limits.window_start < ${windowStart} THEN ${windowStart} ELSE rate_limits.window_start END
    RETURNING count, window_start`);
  const count = rows[0]?.count ?? 1;
  return { allowed: count <= limit, count, retryAfterSeconds: windowStart + windowSeconds - now };
}

export async function resetRateLimit(bucket: string, key: string): Promise<void> {
  const db = await getDb();
  await db.run(sql`DELETE FROM rate_limits WHERE bucket = ${bucket} AND key = ${key}`);
}
