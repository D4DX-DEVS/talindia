"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { testimonials } from "@/db/schema";
import { logActivity } from "@/lib/admin/activity";
import { adminMutation, invalidate, type ActionResult, type SavedResult } from "@/lib/admin/guard";
import { requireAdmin } from "@/lib/auth/session";
import { TAGS } from "@/lib/data/tags";
import { idSchema, testimonialSchema, type TestimonialInput } from "@/lib/validation/admin";

export async function saveTestimonial(id: number | null, input: TestimonialInput): Promise<SavedResult> {
  return adminMutation(testimonialSchema, input, async (data, session) => {
    const db = await getDb();
    const values = { ...data, updatedAt: new Date() };
    let savedId: number;
    if (id) {
      const [prev] = await db.select({ id: testimonials.id }).from(testimonials).where(eq(testimonials.id, id)).limit(1);
      if (!prev) return { ok: false, message: "This testimonial no longer exists." };
      await db.update(testimonials).set(values).where(eq(testimonials.id, id));
      savedId = id;
    } else {
      const [row] = await db.insert(testimonials).values(values).returning({ id: testimonials.id });
      savedId = row.id;
    }
    invalidate(TAGS.testimonials);
    await logActivity({ actor: session.email, action: id ? "testimonial.update" : "testimonial.create", entityType: "testimonial", entityId: savedId, summary: data.name });
    return { ok: true, message: id ? "Testimonial saved." : "Testimonial created.", id: savedId };
  });
}

export async function deleteTestimonial(id: number): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, message: "Invalid id." };
  const db = await getDb();
  const [row] = await db.select({ name: testimonials.name }).from(testimonials).where(eq(testimonials.id, parsed.data)).limit(1);
  if (!row) return { ok: false, message: "This testimonial no longer exists." };
  await db.delete(testimonials).where(eq(testimonials.id, parsed.data));
  invalidate(TAGS.testimonials);
  await logActivity({ actor: session.email, action: "testimonial.delete", entityType: "testimonial", entityId: parsed.data, summary: row.name });
  return { ok: true, message: `Deleted testimonial from ${row.name}.` };
}
