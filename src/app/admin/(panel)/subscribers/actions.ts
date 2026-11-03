"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { subscribers } from "@/db/schema";
import { logActivity } from "@/lib/admin/activity";
import type { ActionResult } from "@/lib/admin/guard";
import { requireAdmin } from "@/lib/auth/session";
import { idSchema } from "@/lib/validation/admin";

export async function setSubscriberStatus(id: number, status: "subscribed" | "unsubscribed"): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success || (status !== "subscribed" && status !== "unsubscribed")) return { ok: false, message: "Invalid request." };
  const db = await getDb();
  const [row] = await db.select({ email: subscribers.email }).from(subscribers).where(eq(subscribers.id, parsed.data)).limit(1);
  if (!row) return { ok: false, message: "This subscriber no longer exists." };
  await db.update(subscribers).set({ status, updatedAt: new Date() }).where(eq(subscribers.id, parsed.data));
  await logActivity({ actor: session.email, action: `subscriber.${status === "subscribed" ? "resubscribe" : "unsubscribe"}`, entityType: "subscriber", entityId: parsed.data, summary: row.email });
  revalidatePath("/admin/subscribers");
  return { ok: true, message: status === "subscribed" ? `${row.email} resubscribed.` : `${row.email} unsubscribed.` };
}

export async function deleteSubscriber(id: number): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, message: "Invalid id." };
  const db = await getDb();
  const [row] = await db.select({ email: subscribers.email }).from(subscribers).where(eq(subscribers.id, parsed.data)).limit(1);
  if (!row) return { ok: false, message: "This subscriber no longer exists." };
  await db.delete(subscribers).where(eq(subscribers.id, parsed.data));
  await logActivity({ actor: session.email, action: "subscriber.delete", entityType: "subscriber", entityId: parsed.data, summary: row.email });
  revalidatePath("/admin/subscribers");
  return { ok: true, message: `Deleted ${row.email}.` };
}
