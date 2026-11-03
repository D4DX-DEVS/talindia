import "server-only";
import { and, asc, count, eq, type SQL } from "drizzle-orm";
import { getDb } from "@/db/client";
import { features, pages, services, testimonials } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { paginate, type ListingQuery, type Paginated } from "@/lib/listing";
import { orderBy, searchAcross } from "./queries";

const pub = (s?: string) => (s === "draft" || s === "published" ? s : undefined);

// ------------------------------------------------------------ services

export const SERVICE_SORTS = ["order", "title", "updated"] as const;
export type ServiceSort = (typeof SERVICE_SORTS)[number];

export async function listServices(q: ListingQuery<ServiceSort>, filters: { status?: string }) {
  await requireAdmin();
  const db = await getDb();
  const where: (SQL | undefined)[] = [];
  const st = pub(filters.status);
  if (st) where.push(eq(services.status, st));
  where.push(searchAcross(q.search, [services.title, services.slug, services.summary]));
  const cond = and(...where);
  const col = { order: services.sortOrder, title: services.title, updated: services.updatedAt }[q.sort];
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ id: services.id, slug: services.slug, title: services.title, summary: services.summary, highlights: services.highlights, status: services.status, sortOrder: services.sortOrder, updatedAt: services.updatedAt })
      .from(services)
      .where(cond)
      .orderBy(orderBy(col, q.order), asc(services.id))
      .limit(q.pageSize)
      .offset((q.page - 1) * q.pageSize),
    db.select({ total: count() }).from(services).where(cond),
  ]);
  return paginate(rows, total, q.page, q.pageSize);
}

export async function getServiceForEdit(id: number) {
  await requireAdmin();
  const db = await getDb();
  const [row] = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return row ?? null;
}

// ------------------------------------------------------------ features

export const FEATURE_SORTS = ["order", "title", "updated"] as const;
export type FeatureSort = (typeof FEATURE_SORTS)[number];

export interface AdminFeatureRow {
  id: number;
  group: "why_choose" | "offerings";
  title: string;
  icon: string;
  status: "draft" | "published";
  sortOrder: number;
  updatedAt: Date;
}

export async function listFeatures(q: ListingQuery<FeatureSort>, filters: { status?: string; group?: string }): Promise<Paginated<AdminFeatureRow>> {
  await requireAdmin();
  const db = await getDb();
  const where: (SQL | undefined)[] = [];
  const st = pub(filters.status);
  if (st) where.push(eq(features.status, st));
  if (filters.group === "why_choose" || filters.group === "offerings") where.push(eq(features.group, filters.group));
  where.push(searchAcross(q.search, [features.title, features.description]));
  const cond = and(...where);
  const col = { order: features.sortOrder, title: features.title, updated: features.updatedAt }[q.sort];
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ id: features.id, group: features.group, title: features.title, icon: features.icon, status: features.status, sortOrder: features.sortOrder, updatedAt: features.updatedAt })
      .from(features)
      .where(cond)
      .orderBy(orderBy(col, q.order), asc(features.id))
      .limit(q.pageSize)
      .offset((q.page - 1) * q.pageSize),
    db.select({ total: count() }).from(features).where(cond),
  ]);
  return paginate(rows, total, q.page, q.pageSize);
}

export async function getFeatureForEdit(id: number) {
  await requireAdmin();
  const db = await getDb();
  const [row] = await db.select().from(features).where(eq(features.id, id)).limit(1);
  return row ?? null;
}

// ------------------------------------------------------------ testimonials

export const TESTIMONIAL_SORTS = ["order", "name", "updated"] as const;
export type TestimonialSort = (typeof TESTIMONIAL_SORTS)[number];

export async function listTestimonials(q: ListingQuery<TestimonialSort>, filters: { status?: string }) {
  await requireAdmin();
  const db = await getDb();
  const where: (SQL | undefined)[] = [];
  const st = pub(filters.status);
  if (st) where.push(eq(testimonials.status, st));
  where.push(searchAcross(q.search, [testimonials.name, testimonials.role, testimonials.quote]));
  const cond = and(...where);
  const col = { order: testimonials.sortOrder, name: testimonials.name, updated: testimonials.updatedAt }[q.sort];
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ id: testimonials.id, name: testimonials.name, role: testimonials.role, quote: testimonials.quote, status: testimonials.status, sortOrder: testimonials.sortOrder, updatedAt: testimonials.updatedAt })
      .from(testimonials)
      .where(cond)
      .orderBy(orderBy(col, q.order), asc(testimonials.id))
      .limit(q.pageSize)
      .offset((q.page - 1) * q.pageSize),
    db.select({ total: count() }).from(testimonials).where(cond),
  ]);
  return paginate(rows, total, q.page, q.pageSize);
}

export async function getTestimonialForEdit(id: number) {
  await requireAdmin();
  const db = await getDb();
  const [row] = await db.select().from(testimonials).where(eq(testimonials.id, id)).limit(1);
  return row ?? null;
}

// ------------------------------------------------------------ pages

export const PAGE_SORTS = ["title", "slug", "updated"] as const;
export type PageSort = (typeof PAGE_SORTS)[number];

export async function listPages(q: ListingQuery<PageSort>, filters: { status?: string; kind?: string }) {
  await requireAdmin();
  const db = await getDb();
  const where: (SQL | undefined)[] = [];
  const st = pub(filters.status);
  if (st) where.push(eq(pages.status, st));
  if (filters.kind === "system") where.push(eq(pages.system, true));
  if (filters.kind === "custom") where.push(eq(pages.system, false));
  where.push(searchAcross(q.search, [pages.title, pages.slug, pages.intro]));
  const cond = and(...where);
  const col = { title: pages.title, slug: pages.slug, updated: pages.updatedAt }[q.sort];
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ id: pages.id, slug: pages.slug, title: pages.title, status: pages.status, system: pages.system, updatedAt: pages.updatedAt })
      .from(pages)
      .where(cond)
      .orderBy(orderBy(col, q.order), asc(pages.id))
      .limit(q.pageSize)
      .offset((q.page - 1) * q.pageSize),
    db.select({ total: count() }).from(pages).where(cond),
  ]);
  return paginate(rows, total, q.page, q.pageSize);
}

export async function getPageForEdit(id: number) {
  await requireAdmin();
  const db = await getDb();
  const [row] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  return row ?? null;
}

/** Public path of a page by slug. */
export function pagePath(slug: string): string {
  return slug === "home" ? "/" : `/${slug}/`;
}
