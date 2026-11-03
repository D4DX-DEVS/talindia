"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getEnv } from "@/db/client";
import { logActivity } from "@/lib/admin/activity";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, getSession } from "@/lib/auth/session";
import { hashIp, rateLimit, requestMeta, resetRateLimit, sha256Hex, timingSafeEqual } from "@/lib/security";

const loginSchema = z.object({
  email: z.email().trim().max(200),
  password: z.string().min(1).max(200),
});

export interface LoginState {
  error?: string;
}

const INVALID = "Incorrect email or password.";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: INVALID };
  const email = parsed.data.email.toLowerCase();

  const meta = await requestMeta();
  const ipKey = await hashIp(meta.ip);
  const emailKey = (await sha256Hex(email)).slice(0, 32);
  // 5 failures per IP per 15 minutes, 20 per account per hour.
  const [byIp, byEmail] = await Promise.all([rateLimit("login-ip", ipKey, 5, 15 * 60), rateLimit("login-email", emailKey, 20, 60 * 60)]);
  if (!byIp.allowed || !byEmail.allowed) {
    await logActivity({ actor: email, action: "login.blocked", entityType: "auth", summary: "Rate limit reached" });
    const wait = Math.ceil(Math.max(byIp.allowed ? 0 : byIp.retryAfterSeconds, byEmail.allowed ? 0 : byEmail.retryAfterSeconds) / 60);
    return { error: `Too many attempts. Try again in ${wait} minute${wait === 1 ? "" : "s"}.` };
  }

  const env = await getEnv();
  const configuredEmail = (env.ADMIN_EMAIL ?? "").toLowerCase();
  const hash = env.ADMIN_PASSWORD_HASH ?? "";
  if (!configuredEmail || !hash) return { error: "Admin login is not configured on this server." };

  // Always run the hash so response time does not reveal whether the email matched.
  const passwordOk = await verifyPassword(parsed.data.password, hash);
  const emailOk = timingSafeEqual(await sha256Hex(email), await sha256Hex(configuredEmail));
  if (!passwordOk || !emailOk) {
    await logActivity({ actor: email, action: "login.failed", entityType: "auth" });
    return { error: INVALID };
  }

  await Promise.all([resetRateLimit("login-ip", ipKey), resetRateLimit("login-email", emailKey)]);
  await createSession(configuredEmail);
  await logActivity({ actor: configuredEmail, action: "login.success", entityType: "auth" });
  redirect("/admin/");
}

export async function logout(): Promise<void> {
  const session = await getSession();
  await destroySession();
  if (session) await logActivity({ actor: session.email, action: "logout", entityType: "auth" });
  redirect("/admin/login/");
}
