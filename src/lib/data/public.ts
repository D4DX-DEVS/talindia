import "server-only";
import { and, asc, count, eq, or, sql, type SQL } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import {
  courses,
  features,
  media,
  pages,
  services,
  settings,
  testimonials,
  type CourseAvailability,
  type FeatureGroup,
} from "@/db/schema";
import { likePattern, paginate, type Paginated } from "@/lib/listing";
import { SETTINGS_KEYS, settingsSchemas, type Settings } from "@/lib/settings-schema";
import { TAGS } from "./tags";

export { mediaUrl } from "@/lib/media-url";

/*
 * Every public read goes through a "use cache" function tagged by entity, so admin edits
 * invalidate exactly what changed. `connection()` runs first so nothing is read from D1 at
 * build time (the build machine only has local data).
 */

export interface ImageRef {
  key: string;
  alt: string;
  width: number | null;
  height: number | null;
}

const imageCols = {
  imageKey: media.key,
  imageAlt: media.alt,
  imageWidth: media.width,
  imageHeight: media.height,
};

function toImage(row: ImageCols): ImageRef | null {
  return row.imageKey ? { key: row.imageKey, alt: row.imageAlt ?? "", width: row.imageWidth, height: row.imageHeight } : null;
}

// ------------------------------------------------------------ settings

async function readSettings(): Promise<Settings> {
  "use cache";
  cacheTag(TAGS.settings);
  cacheLife("days");
  const db = await getDb();
  const rows = await db.select().from(settings);
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const out: Partial<Record<keyof Settings, unknown>> = {};
  for (const key of SETTINGS_KEYS) {
    const parsed = settingsSchemas[key].safeParse(map.get(key));
    if (!parsed.success) throw new Error(`Setting "${key}" is missing or invalid. Run the migration seed or fix it in /admin/settings.`);
    out[key] = parsed.data;
  }
  return out as Settings;
}

export async function getSettings(): Promise<Settings> {
  await connection();
  return readSettings();
}

// ------------------------------------------------------------ pages

export interface PublicPage {
  slug: string;
  title: string;
  intro: string;
  body: string;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: Date;
  image: ImageRef | null;
}

async function readPage(slug: string): Promise<PublicPage | null> {
  "use cache";
  cacheTag(TAGS.pages, TAGS.page(slug));
  cacheLife("days");
  const db = await getDb();
  const [row] = await db
    .select({
      slug: pages.slug,
      title: pages.title,
      intro: pages.intro,
      body: pages.body,
      seoTitle: pages.seoTitle,
      seoDescription: pages.seoDescription,
      updatedAt: pages.updatedAt,
      ...imageCols,
    })
    .from(pages)
    .leftJoin(media, eq(media.id, pages.imageId))
    .where(and(eq(pages.slug, slug), eq(pages.status, "published")))
    .limit(1);
  if (!row) return null;
  const { imageKey, imageAlt, imageWidth, imageHeight, ...rest } = row;
  return { ...rest, image: toImage({ imageKey, imageAlt, imageWidth, imageHeight }) };
}

export async function getPage(slug: string): Promise<PublicPage | null> {
  await connection();
  return readPage(slug);
}

async function readCustomPageSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  "use cache";
  cacheTag(TAGS.pages);
  const db = await getDb();
  return db
    .select({ slug: pages.slug, updatedAt: pages.updatedAt })
    .from(pages)
    .where(and(eq(pages.status, "published"), eq(pages.system, false)));
}

export async function getCustomPageSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  await connection();
  return readCustomPageSlugs();
}

// ------------------------------------------------------------ courses

export interface PublicCourse {
  id: number;
  slug: string;
  title: string;
  audience: string;
  highlights: string[];
  marketGap: string | null;
  category: string;
  availability: CourseAvailability;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: Date;
  image: ImageRef | null;
}

const courseCols = {
  id: courses.id,
  slug: courses.slug,
  title: courses.title,
  audience: courses.audience,
  highlights: courses.highlights,
  marketGap: courses.marketGap,
  category: courses.category,
  availability: courses.availability,
  seoTitle: courses.seoTitle,
  seoDescription: courses.seoDescription,
  updatedAt: courses.updatedAt,
  ...imageCols,
};

interface ImageCols {
  imageKey: string | null;
  imageAlt: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
}

function toCourse(row: Omit<PublicCourse, "image"> & ImageCols): PublicCourse {
  const { imageKey, imageAlt, imageWidth, imageHeight, ...rest } = row;
  return { ...rest, image: toImage({ imageKey, imageAlt, imageWidth, imageHeight }) };
}

export interface CourseFilters {
  search: string;
  availability?: CourseAvailability;
  page: number;
  pageSize: number;
}

async function readCourses(filters: CourseFilters): Promise<Paginated<PublicCourse>> {
  "use cache";
  cacheTag(TAGS.courses);
  cacheLife("hours");
  const db = await getDb();
  const where: SQL[] = [eq(courses.status, "published")];
  if (filters.availability) where.push(eq(courses.availability, filters.availability));
  if (filters.search) {
    const p = likePattern(filters.search);
    const match = or(
      sql`${courses.title} LIKE ${p} ESCAPE '\\'`,
      sql`${courses.audience} LIKE ${p} ESCAPE '\\'`,
      sql`${courses.highlights} LIKE ${p} ESCAPE '\\'`,
      sql`${courses.category} LIKE ${p} ESCAPE '\\'`,
    );
    if (match) where.push(match);
  }
  const cond = and(...where);
  const [rows, [{ total }]] = await Promise.all([
    db
      .select(courseCols)
      .from(courses)
      .leftJoin(media, eq(media.id, courses.imageId))
      .where(cond)
      .orderBy(asc(courses.sortOrder), asc(courses.title))
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize),
    db.select({ total: count() }).from(courses).where(cond),
  ]);
  return paginate(rows.map(toCourse), total, filters.page, filters.pageSize);
}

export async function getCourses(filters: CourseFilters): Promise<Paginated<PublicCourse>> {
  await connection();
  return readCourses(filters);
}

async function readCourse(slug: string): Promise<PublicCourse | null> {
  "use cache";
  cacheTag(TAGS.courses, TAGS.course(slug));
  cacheLife("hours");
  const db = await getDb();
  const [row] = await db
    .select(courseCols)
    .from(courses)
    .leftJoin(media, eq(media.id, courses.imageId))
    .where(and(eq(courses.slug, slug), eq(courses.status, "published")))
    .limit(1);
  return row ? toCourse(row) : null;
}

export async function getCourse(slug: string): Promise<PublicCourse | null> {
  await connection();
  return readCourse(slug);
}

// ------------------------------------------------------------ services, features, testimonials

export interface PublicService {
  id: number;
  slug: string;
  title: string;
  summary: string;
  highlights: string[];
  icon: string;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: Date;
  image: ImageRef | null;
}

const serviceCols = {
  id: services.id,
  slug: services.slug,
  title: services.title,
  summary: services.summary,
  highlights: services.highlights,
  icon: services.icon,
  seoTitle: services.seoTitle,
  seoDescription: services.seoDescription,
  updatedAt: services.updatedAt,
  ...imageCols,
};

async function readServices(): Promise<PublicService[]> {
  "use cache";
  cacheTag(TAGS.services);
  cacheLife("days");
  const db = await getDb();
  const rows = await db
    .select(serviceCols)
    .from(services)
    .leftJoin(media, eq(media.id, services.imageId))
    .where(eq(services.status, "published"))
    .orderBy(asc(services.sortOrder));
  return rows.map(({ imageKey, imageAlt, imageWidth, imageHeight, ...rest }) => ({
    ...rest,
    image: toImage({ imageKey, imageAlt, imageWidth, imageHeight }),
  }));
}

export async function getServices(): Promise<PublicService[]> {
  await connection();
  return readServices();
}

/** A service has its own page only when there is something beyond its title to say. */
export function serviceHasPage(s: Pick<PublicService, "summary" | "highlights">): boolean {
  return Boolean(s.summary.trim()) || s.highlights.length > 0;
}

export async function getService(slug: string): Promise<PublicService | null> {
  const all = await getServices();
  return all.find((s) => s.slug === slug && serviceHasPage(s)) ?? null;
}

export interface PublicFeature {
  id: number;
  title: string;
  description: string;
  icon: string;
}

async function readFeatures(group: FeatureGroup): Promise<PublicFeature[]> {
  "use cache";
  cacheTag(TAGS.features);
  cacheLife("days");
  const db = await getDb();
  return db
    .select({ id: features.id, title: features.title, description: features.description, icon: features.icon })
    .from(features)
    .where(and(eq(features.group, group), eq(features.status, "published")))
    .orderBy(asc(features.sortOrder));
}

export async function getFeatures(group: FeatureGroup): Promise<PublicFeature[]> {
  await connection();
  return readFeatures(group);
}

export interface PublicTestimonial {
  id: number;
  quote: string;
  name: string;
  role: string;
}

async function readTestimonials(): Promise<PublicTestimonial[]> {
  "use cache";
  cacheTag(TAGS.testimonials);
  cacheLife("days");
  const db = await getDb();
  return db
    .select({ id: testimonials.id, quote: testimonials.quote, name: testimonials.name, role: testimonials.role })
    .from(testimonials)
    .where(eq(testimonials.status, "published"))
    .orderBy(asc(testimonials.sortOrder));
}

export async function getTestimonials(): Promise<PublicTestimonial[]> {
  await connection();
  return readTestimonials();
}

export async function getMediaByKey(key: string): Promise<ImageRef | null> {
  if (!key) return null;
  await connection();
  return readMediaByKey(key);
}

async function readMediaByKey(key: string): Promise<ImageRef | null> {
  "use cache";
  cacheTag(TAGS.media);
  const db = await getDb();
  const [row] = await db
    .select({ key: media.key, alt: media.alt, width: media.width, height: media.height })
    .from(media)
    .where(eq(media.key, key))
    .limit(1);
  return row ?? null;
}

