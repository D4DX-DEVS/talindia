import "server-only";
import { eq, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, getEnv } from "@/db/client";
import { sessions } from "@/db/schema";
import { hashIp, randomToken, requestMeta, sha256Hex } from "@/lib/security";

const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8h absolute lifetime
const REFRESH_AFTER_SECONDS = 60 * 60; // extend at most once an hour

export interface AdminSession {
  id: string;
  email: string;
  expiresAt: Date;
}

async function cookieName(): Promise<string> {
  const env = await getEnv();
  // __Host- requires Secure, which local http dev cannot send.
  return env.SITE_URL?.startsWith("https://") && process.env.NODE_ENV === "production" ? "__Host-talindia_admin" : "talindia_admin";
}

export async function createSession(email: string): Promise<void> {
  const token = randomToken(32);
  const id = await sha256Hex(token);
  const meta = await requestMeta();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const db = await getDb();
  await db.insert(sessions).values({ id, email, ipHash: await hashIp(meta.ip), userAgent: meta.userAgent, expiresAt });
  // Opportunistic cleanup of expired rows.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  const jar = await cookies();
  jar.set(await cookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Reads and validates the session cookie. Never trusts anything but the D1 row. */
export async function getSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const token = jar.get(await cookieName())?.value;
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const id = await sha256Hex(token);
  const db = await getDb();
  const [row] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  if (!row) return null;
  if (row.expiresAt.getTime() <= Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }
  // The configured admin may have been changed or removed: old sessions die with it.
  const env = await getEnv();
  if (!env.ADMIN_EMAIL || row.email !== env.ADMIN_EMAIL.toLowerCase()) return null;
  // Sliding refresh, bounded by an hourly write.
  const remaining = row.expiresAt.getTime() - Date.now();
  if (SESSION_TTL_SECONDS * 1000 - remaining > REFRESH_AFTER_SECONDS * 1000) {
    const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
    await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
    try {
      jar.set(await cookieName(), token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
    } catch {
      // cookies() is read-only during render; the refreshed expiry still applies server-side.
    }
    return { id, email: row.email, expiresAt };
  }
  return { id, email: row.email, expiresAt: row.expiresAt };
}

/** Use at the top of every admin page and server action. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) redirect("/admin/login/");
  return session;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const name = await cookieName();
  const token = jar.get(name)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.id, await sha256Hex(token)));
  }
  jar.delete(name);
}
