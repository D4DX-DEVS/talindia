import "server-only";
import { and, asc, count, desc, eq, like, not, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db/client";
import { courses, media, pages, services, settings, type Media } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { paginate, type ListingQuery, type Paginated } from "@/lib/listing";
import { orderBy, searchAcross } from "./queries";

export const MEDIA_SORTS = ["created", "name", "size"] as const;
export type MediaSort = (typeof MEDIA_SORTS)[number];
export const MEDIA_TYPES = ["images", "svg", "other"] as const;
export type MediaTypeFilter = (typeof MEDIA_TYPES)[number];

export type MediaRow = Pick<Media, "id" | "key" | "filename" | "mimeType" | "size" | "width" | "height" | "alt" | "createdAt">;

function typeCondition(type: MediaTypeFilter | undefined): SQL | undefined {
  if (type === "svg") return eq(media.mimeType, "image/svg+xml");
  if (type === "images") return and(like(media.mimeType, "image/%"), not(eq(media.mimeType, "image/svg+xml")));
  if (type === "other") return not(like(media.mimeType, "image/%"));
  return undefined;
}

export async function listMedia(q: ListingQuery<MediaSort>, type?: MediaTypeFilter): Promise<Paginated<MediaRow>> {
  await requireAdmin();
  const db = await getDb();
  const cond = and(typeCondition(type), searchAcross(q.search, [media.filename, media.alt, media.title, media.key]));
  const sortCol = { created: media.createdAt, name: media.filename, size: media.size }[q.sort];
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: media.id,
        key: media.key,
        filename: media.filename,
        mimeType: media.mimeType,
        size: media.size,
        width: media.width,
        height: media.height,
        alt: media.alt,
        createdAt: media.createdAt,
      })
      .from(media)
      .where(cond)
      .orderBy(orderBy(sortCol, q.order), desc(media.id))
      .limit(q.pageSize)
      .offset((q.page - 1) * q.pageSize),
    db.select({ total: count() }).from(media).where(cond),
  ]);
  return paginate(rows, total, q.page, q.pageSize);
}

export async function getMediaDetail(id: number): Promise<Media | null> {
  await requireAdmin();
  const db = await getDb();
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  return row ?? null;
}

export interface MediaUsage {
  kind: "course" | "service" | "page" | "setting";
  label: string;
  href: string;
  /** Cache tag to expire if this usage changes. */
  tag: string;
}

/** Everywhere a file is referenced: entity image columns and image keys inside settings JSON. */
export async function mediaUsage(id: number, key: string): Promise<MediaUsage[]> {
  await requireAdmin();
  const db = await getDb();
  const [c, s, p, st] = await Promise.all([
    db.select({ id: courses.id, title: courses.title }).from(courses).where(eq(courses.imageId, id)).orderBy(asc(courses.title)),
    db.select({ id: services.id, title: services.title }).from(services).where(eq(services.imageId, id)).orderBy(asc(services.title)),
    db.select({ id: pages.id, title: pages.title }).from(pages).where(eq(pages.imageId, id)).orderBy(asc(pages.title)),
    db
      .select({ key: settings.key, value: settings.value })
      .from(settings)
      .where(or(sql`instr(${settings.value}, ${JSON.stringify(key)}) > 0`, sql`instr(${settings.value}, ${key}) > 0`)),
  ]);
  return [
    ...c.map((r) => ({ kind: "course" as const, label: `Training: ${r.title}`, href: `/admin/courses/${r.id}/`, tag: "courses" })),
    ...s.map((r) => ({ kind: "service" as const, label: `Service: ${r.title}`, href: `/admin/services/${r.id}/`, tag: "services" })),
    ...p.map((r) => ({ kind: "page" as const, label: `Page: ${r.title}`, href: `/admin/pages/${r.id}/`, tag: "pages" })),
    ...st.map((r) => ({ kind: "setting" as const, label: `Setting: ${r.key}`, href: `/admin/settings/#${r.key}`, tag: "settings" })),
  ];
}
