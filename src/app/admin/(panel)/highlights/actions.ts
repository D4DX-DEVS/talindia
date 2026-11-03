"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { features } from "@/db/schema";
import { logActivity } from "@/lib/admin/activity";
import { adminMutation, invalidate, type ActionResult, type SavedResult } from "@/lib/admin/guard";
import { requireAdmin } from "@/lib/auth/session";
import { TAGS } from "@/lib/data/tags";
import { featureSchema, idSchema, type FeatureInput } from "@/lib/validation/admin";

export async function saveFeature(id: number | null, input: FeatureInput): Promise<SavedResult> {
  return adminMutation(featureSchema, input, async (data, session) => {
    const db = await getDb();
    const values = { ...data, updatedAt: new Date() };
    let savedId: number;
    if (id) {
      const [prev] = await db.select({ id: features.id }).from(features).where(eq(features.id, id)).limit(1);
      if (!prev) return { ok: false, message: "This highlight no longer exists." };
      await db.update(features).set(values).where(eq(features.id, id));
      savedId = id;
    } else {
      const [row] = await db.insert(features).values(values).returning({ id: features.id });
      savedId = row.id;
    }
    invalidate(TAGS.features);
    await logActivity({ actor: session.email, action: id ? "feature.update" : "feature.create", entityType: "feature", entityId: savedId, summary: data.title });
    return { ok: true, message: id ? "Highlight saved." : "Highlight created.", id: savedId };
  });
}

export async function deleteFeature(id: number): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, message: "Invalid id." };
  const db = await getDb();
  const [row] = await db.select({ title: features.title }).from(features).where(eq(features.id, parsed.data)).limit(1);
  if (!row) return { ok: false, message: "This highlight no longer exists." };
  await db.delete(features).where(eq(features.id, parsed.data));
  invalidate(TAGS.features);
  await logActivity({ actor: session.email, action: "feature.delete", entityType: "feature", entityId: parsed.data, summary: row.title });
  return { ok: true, message: `Deleted “${row.title}”.` };
}
