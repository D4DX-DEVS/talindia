import "server-only";
import { and, asc, count, desc, eq, sql, type AnyColumn, type SQL } from "drizzle-orm";
import { getDb } from "@/db/client";
import { courses, media } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { likePattern, paginate, type ListingQuery, type Paginated } from "@/lib/listing";
import type { PickerItem } from "@/app/admin/(panel)/media/picker-actions";

/** Admin reads bypass the public cache and always re-check the session (defence in depth). */

export function orderBy(column: AnyColumn | SQL, order: "asc" | "desc"): SQL {
  return order === "asc" ? asc(column) : desc(column);
}

/** `(a LIKE p OR b LIKE p ...)` with LIKE wildcards in the term escaped. */
export function searchAcross(search: string, columns: AnyColumn[]): SQL | undefined {
  if (!search) return undefined;
  const p = likePattern(search);
  return sql`(${sql.join(
    columns.map((c) => sql`${c} LIKE ${p} ESCAPE '\\'`),
    sql` OR `,
  )})`;
}

export async function mediaPreview(id: number | null): Promise<PickerItem | null> {
  if (!id) return null;
  const db = await getDb();
  const [row] = await db
    .select({ id: media.id, key: media.key, filename: media.filename, alt: media.alt, width: media.width, height: media.height, mimeType: media.mimeType })
    .from(media)
    .where(eq(media.id, id))
    .limit(1);
  return row ?? null;
}

// ------------------------------------------------------------ courses

export const COURSE_SORTS = ["order", "title", "updated"] as const;
export type CourseSort = (typeof COURSE_SORTS)[number];

export interface AdminCourseRow {
  id: number;
  slug: string;
  title: string;
  audience: string;
  status: "draft" | "published";
  availability: "coming_soon" | "open" | "closed";
  sortOrder: number;
  updatedAt: Date;
}

export async function listCourses(
  q: ListingQuery<CourseSort>,
  filters: { status?: string; availability?: string },
): Promise<Paginated<AdminCourseRow>> {
  await requireAdmin();
  const db = await getDb();
  const where: (SQL | undefined)[] = [];
  if (filters.status === "draft" || filters.status === "published") where.push(eq(courses.status, filters.status));
  if (filters.availability === "coming_soon" || filters.availability === "open" || filters.availability === "closed") {
    where.push(eq(courses.availability, filters.availability));
  }
  where.push(searchAcross(q.search, [courses.title, courses.slug, courses.audience]));
  const cond = and(...where);
  const sortCol = { order: courses.sortOrder, title: courses.title, updated: courses.updatedAt }[q.sort];
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: courses.id,
        slug: courses.slug,
        title: courses.title,
        audience: courses.audience,
        status: courses.status,
        availability: courses.availability,
        sortOrder: courses.sortOrder,
        updatedAt: courses.updatedAt,
      })
      .from(courses)
      .where(cond)
      .orderBy(orderBy(sortCol, q.order), asc(courses.id))
      .limit(q.pageSize)
      .offset((q.page - 1) * q.pageSize),
    db.select({ total: count() }).from(courses).where(cond),
  ]);
  return paginate(rows, total, q.page, q.pageSize);
}

export async function getCourseForEdit(id: number) {
  await requireAdmin();
  const db = await getDb();
  const [row] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  return row ?? null;
}
