"use server";

import { count, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { courses, enquiries } from "@/db/schema";
import { logActivity } from "@/lib/admin/activity";
import { adminMutation, invalidate, type ActionResult, type SavedResult } from "@/lib/admin/guard";
import { TAGS } from "@/lib/data/tags";
import { courseSchema, idSchema, type CourseInput } from "@/lib/validation/admin";
import { requireAdmin } from "@/lib/auth/session";

export async function saveCourse(id: number | null, input: CourseInput): Promise<SavedResult> {
  return adminMutation(courseSchema, input, async (data, session) => {
    const db = await getDb();
    const values = {
      ...data,
      marketGap: data.marketGap || null,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      updatedAt: new Date(),
    };
    let savedId: number;
    let previousSlug: string | null = null;
    if (id) {
      const [prev] = await db.select({ slug: courses.slug }).from(courses).where(eq(courses.id, id)).limit(1);
      if (!prev) return { ok: false, message: "This training no longer exists." };
      previousSlug = prev.slug;
      await db.update(courses).set(values).where(eq(courses.id, id));
      savedId = id;
    } else {
      const [row] = await db.insert(courses).values(values).returning({ id: courses.id });
      savedId = row.id;
    }
    invalidate(TAGS.courses, TAGS.course(data.slug), ...(previousSlug ? [TAGS.course(previousSlug)] : []));
    await logActivity({ actor: session.email, action: id ? "course.update" : "course.create", entityType: "course", entityId: savedId, summary: data.title });
    return { ok: true, message: id ? "Training saved." : "Training created.", id: savedId };
  });
}

export async function deleteCourse(id: number): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, message: "Invalid id." };
  const db = await getDb();
  const [row] = await db.select({ slug: courses.slug, title: courses.title }).from(courses).where(eq(courses.id, parsed.data)).limit(1);
  if (!row) return { ok: false, message: "This training no longer exists." };
  const [{ linked }] = await db.select({ linked: count() }).from(enquiries).where(eq(enquiries.courseId, parsed.data));
  // Enquiries keep their text; the FK is ON DELETE SET NULL.
  await db.delete(courses).where(eq(courses.id, parsed.data));
  invalidate(TAGS.courses, TAGS.course(row.slug));
  await logActivity({ actor: session.email, action: "course.delete", entityType: "course", entityId: parsed.data, summary: `${row.title}${linked ? ` (${linked} enquiries unlinked)` : ""}` });
  return { ok: true, message: `Deleted “${row.title}”.` };
}
