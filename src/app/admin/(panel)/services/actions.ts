"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { services } from "@/db/schema";
import { logActivity } from "@/lib/admin/activity";
import { adminMutation, invalidate, type ActionResult, type SavedResult } from "@/lib/admin/guard";
import { requireAdmin } from "@/lib/auth/session";
import { TAGS } from "@/lib/data/tags";
import { idSchema, serviceSchema, type ServiceInput } from "@/lib/validation/admin";

export async function saveService(id: number | null, input: ServiceInput): Promise<SavedResult> {
  return adminMutation(serviceSchema, input, async (data, session) => {
    const db = await getDb();
    const values = { ...data, seoTitle: data.seoTitle || null, seoDescription: data.seoDescription || null, updatedAt: new Date() };
    let savedId: number;
    if (id) {
      const [prev] = await db.select({ id: services.id }).from(services).where(eq(services.id, id)).limit(1);
      if (!prev) return { ok: false, message: "This service no longer exists." };
      await db.update(services).set(values).where(eq(services.id, id));
      savedId = id;
    } else {
      const [row] = await db.insert(services).values(values).returning({ id: services.id });
      savedId = row.id;
    }
    invalidate(TAGS.services);
    await logActivity({ actor: session.email, action: id ? "service.update" : "service.create", entityType: "service", entityId: savedId, summary: data.title });
    return { ok: true, message: id ? "Service saved." : "Service created.", id: savedId };
  });
}

export async function deleteService(id: number): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, message: "Invalid id." };
  const db = await getDb();
  const [row] = await db.select({ title: services.title }).from(services).where(eq(services.id, parsed.data)).limit(1);
  if (!row) return { ok: false, message: "This service no longer exists." };
  await db.delete(services).where(eq(services.id, parsed.data));
  invalidate(TAGS.services);
  await logActivity({ actor: session.email, action: "service.delete", entityType: "service", entityId: parsed.data, summary: row.title });
  return { ok: true, message: `Deleted “${row.title}”.` };
}
